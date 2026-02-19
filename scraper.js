const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

puppeteer.use(StealthPlugin());

// Helper for random delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function scrapeWithRetry(url, scrapeFunction, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        const browser = await puppeteer.launch({
            headless: "new",
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--window-size=1920,1080',
                '--disable-blink-features=AutomationControlled',
                '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ]
        });

        try {
            const page = await browser.newPage();
            await page.setViewport({ width: 1920, height: 1080 });

            // Random delay before navigation
            const setupDelay = Math.floor(Math.random() * 2000) + 1000;
            await delay(setupDelay);

            console.log(`Attempt ${i + 1}/${maxRetries}: Navigating to ${url}...`);
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

            // Execute the specific scraping logic
            const data = await scrapeFunction(page);

            if (data) {
                return data; // Success
            } else {
                throw new Error("Scraper returned null/empty data");
            }

        } catch (error) {
            console.error(`Attempt ${i + 1} failed: ${error.message}`);
            if (i === maxRetries - 1) throw error; // Throw if last attempt
            await delay(3000); // Wait 3s before retry
        } finally {
            await browser.close();
        }
    }
}

async function scrapeRacingPost(url) {
    return scrapeWithRetry(url, async (page) => {
        await page.waitForSelector('body', { timeout: 10000 });

        const runners = await page.evaluate(() => {
            const data = [];
            const rows = Array.from(document.querySelectorAll("div[class*='RunnersTableRow_divTableRow']"));

            if (rows.length === 0) return [];

            rows.forEach(row => {
                const nameEl = row.querySelector("[class*='RunnersTableRow_runner_horse_name']");
                const name = nameEl ? nameEl.innerText.trim() : null;

                const cells = Array.from(row.querySelectorAll("div[class*='RunnersTableRow_divTableCell']"));

                let form = null;
                if (cells[0]) {
                    const text = cells[0].innerText.trim();
                    const match = text.match(/[\d\-PUFBCRO]+/g);
                    if (match && match.length > 0) form = match[match.length - 1];
                }

                let trainer = null;
                const trainerEl = row.querySelector("[class*='RunnersTableRow_trainer_name']");
                if (trainerEl) {
                    trainer = trainerEl.innerText.trim();
                } else if (cells[4]) {
                    trainer = cells[4].innerText.replace('T:', '').trim();
                }

                let rpr = null;
                let age = null;
                let weight = null;
                let officialRating = null;

                if (cells.length >= 9) {
                    age = cells[5] ? cells[5].innerText.replace(/\n/g, '').trim() : null;
                    weight = cells[6] ? cells[6].innerText.replace(/\n/g, '').trim() : null;
                    officialRating = cells[7] ? cells[7].innerText.replace(/\n/g, '').trim() : null;
                    rpr = cells[8] ? cells[8].innerText.replace(/\n/g, '').trim() : null;
                }

                if (name) data.push({ name, form, trainer, rpr, age, weight, officialRating });
            });
            return data;
        });

        console.log(`Racing Post: Found ${runners.length} runners.`);
        return runners;
    });
}

async function scrapeOddsChecker(url) {
    return scrapeWithRetry(url, async (page) => {
        // Wait for specific OddsChecker elements
        try {
            await page.waitForSelector('tr.diff-row', { timeout: 10000 });
        } catch (e) {
            console.log("Could not find tr.diff-row, checking page content...");
            const pageContent = await page.evaluate(() => {
                return {
                    title: document.title,
                    h1: document.querySelector('h1') ? document.querySelector('h1').innerText : 'No H1',
                    bodySample: document.body.innerText.substring(0, 200)
                };
            });
            console.log("DEBUG PAGE CONTENT:", pageContent);

            throw new Error(`Selector not found. Page Title: ${pageContent.title}`);
        }

        return await page.evaluate(() => {
            const titleElement = document.querySelector('h1.Title_title__3V00M') || document.querySelector('h1');
            const raceName = titleElement ? titleElement.innerText.trim() : 'Unknown Race';

            const bookmakers = [];

            // Try multiple selectors for bookie headers
            const bookieHeaders = document.querySelectorAll('tr.eventTableHeader .bk-logo-main-90, tr.eventTableHeader a[title]');
            bookieHeaders.forEach(el => bookmakers.push(el.getAttribute('title') || 'Unknown'));

            const horses = [];
            const rows = document.querySelectorAll('tr.diff-row');

            rows.forEach(row => {
                const nameEl = row.querySelector('a.selTxt') || row.querySelector('td.name');
                if (!nameEl) return;
                const horseName = nameEl.innerText.trim();
                const oddsData = {};

                const oddsCells = row.querySelectorAll('td.bc, td.o');

                oddsCells.forEach((cell, index) => {
                    if (index < bookmakers.length) {
                        const bookieName = bookmakers[index];
                        const fraction = cell.dataset.o || cell.innerText.trim();

                        let decimal = 0;
                        if (cell.dataset.odig) decimal = parseFloat(cell.dataset.odig);
                        else if (cell.dataset.fodds) decimal = parseFloat(cell.dataset.fodds);
                        else if (cell.dataset.oddf) decimal = parseFloat(cell.dataset.oddf);

                        if (decimal === 0 && fraction.includes('/')) {
                            const [n, d] = fraction.split('/').map(Number);
                            if (d) decimal = (n / d) + 1;
                        }

                        oddsData[bookieName] = { fraction, decimal };
                    }
                });

                horses.push({ name: horseName, odds: oddsData });
            });

            return { name: raceName, bookmakers, horses };
        });

        if (result.horses.length === 0) {
            throw new Error("No horses found in scrape result");
        }

        return result;
    });
}

async function scrapeCheltenhamFestival(raceUrl, rpUrl) {
    try {
        console.log("Starting Scrape Sequence...");

        // 1. Scrape OddsChecker with Retry
        const targetRace = raceUrl || 'https://www.oddschecker.com/cheltenham-festival/supreme-novices-hurdle/winner';
        const oddsCheckerData = await scrapeOddsChecker(targetRace);

        // 2. Scrape Racing Post with Retry
        const targetRp = rpUrl || 'https://www.racingpost.com/cheltenham-festival/supreme-novices-hurdle/';
        // Start RP scrape in parallel if possible, but sequential is safer for avoiding detection volume
        const expertData = await scrapeRacingPost(targetRp);

        // 3. Merge Data
        const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

        if (oddsCheckerData && oddsCheckerData.horses) {
            console.log('Merging Expert Data...');
            oddsCheckerData.horses.forEach(horse => {
                const expertHorse = expertData.find(e => normalize(e.name) === normalize(horse.name));
                if (expertHorse) {
                    horse.form = expertHorse.form;
                    horse.trainer = expertHorse.trainer;
                    horse.rpr = expertHorse.rpr;
                    horse.age = expertHorse.age;
                    horse.weight = expertHorse.weight;
                    horse.officialRating = expertHorse.officialRating;
                    // console.log(`Merged ${horse.name}`);
                }
            });
            console.log("Merge complete.");
        }

        return [oddsCheckerData];

    } catch (error) {
        console.error('Main Scraper Error:', error);
        // Return empty array instead of crashing, app.js handles empty
        return [];
    }
}

module.exports = { scrapeCheltenhamFestival };
