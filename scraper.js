const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

// --- ANTI-BLOCKING CONFIGURATION ---

const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
];

// Add your proxy servers here if you purchase them (e.g., 'http://user:pass@IP:PORT')
// ROTATING PROXY STRATEGY: Randomly pick one for each session
const PROXIES = [
    // 'http://username:password@1.2.3.4:8080',
    // 'http://username:password@5.6.7.8:8080'
];

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

puppeteer.use(StealthPlugin());

// Helper for random delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function scrapeWithRetry(url, scrapeFunction, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        // 1. ROTATE USER AGENT
        const userAgent = getRandomElement(USER_AGENTS);

        // 2. ROTATE PROXY (If available)
        const proxy = PROXIES.length > 0 ? getRandomElement(PROXIES) : null;

        const launchArgs = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--window-size=1920,1080',
            '--disable-blink-features=AutomationControlled',
            `--user-agent=${userAgent}`
        ];

        if (proxy) {
            launchArgs.push(`--proxy-server=${proxy}`);
        }

        const browser = await puppeteer.launch({
            headless: "new",
            args: launchArgs
        });

        try {
            const page = await browser.newPage();

            // Authenticate proxy if needed
            // if (proxy) await page.authenticate({ username: '...', password: '...' });

            await page.setViewport({ width: 1920, height: 1080 });

            // Set realistic headers to look like a UK user coming from Google
            await page.setExtraHTTPHeaders({
                'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
                'Referer': 'https://www.google.co.uk/'
            });

            // 3. RANDOM DELAY BEFORE NAVIGATION (Increased)
            // Wait between 2 and 5 seconds
            const setupDelay = Math.floor(Math.random() * 3000) + 2000;
            await delay(setupDelay);

            console.log(`Attempt ${i + 1}/${maxRetries}: Navigating to ${url}... (UA: ${userAgent.substring(0, 20)}...)`);
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

            // 4. HUMANIZE INTERACTION (Mouse moves, random scrolling)
            await humanizePage(page);

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


// Helper to simulate human behavior
async function humanizePage(page) {
    try {
        // Random mouse movement
        await page.mouse.move(
            Math.floor(Math.random() * 500),
            Math.floor(Math.random() * 500)
        );

        // Random small scroll
        await page.evaluate(() => {
            window.scrollBy(0, window.innerHeight / 2);
        });

        await delay(Math.floor(Math.random() * 1000) + 500);

    } catch (e) {
        // Ignore errors during humanization
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

                // Jockey Extraction
                let jockey = null;
                const jockeyEl = row.querySelector("[class*='RunnersTableRow_jockey_name']");
                if (jockeyEl) {
                    jockey = jockeyEl.innerText.trim();
                } else if (cells[4]) {
                    // Fallback: sometimes J: Name
                    const txt = cells[4].innerText;
                    if (txt.includes('J:')) {
                        jockey = txt.split('J:')[1].trim();
                    }
                }

                // Course & Distance Indicators (C, D, CD)
                // Often in the name cell or a specific badge
                let courseDistanceWin = null; // 'C', 'D', 'CD', or null
                if (nameEl) {
                    const text = nameEl.innerText;
                    if (text.match(/\bCD\b/)) courseDistanceWin = 'CD';
                    else if (text.match(/\bC\b/)) courseDistanceWin = 'C';
                    else if (text.match(/\bD\b/)) courseDistanceWin = 'D';
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

                if (name) data.push({ name, form, trainer, jockey, courseDistanceWin, rpr, age, weight, officialRating });
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
                    horse.jockey = expertHorse.jockey; // Sync Jockey
                    horse.courseDistanceWin = expertHorse.courseDistanceWin; // Sync C/D
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
