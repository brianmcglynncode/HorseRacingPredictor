const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function scrapeRacingPost() {
    console.log('Launching browser for Racing Post...');
    const browser = await puppeteer.launch({
        headless: "new",
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--window-size=1920,1080'
        ]
    });

    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        const url = 'https://www.racingpost.com/cheltenham-festival/supreme-novices-hurdle/';
        console.log(`Navigating to ${url}...`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Wait for *any* content to load first, to check for blocks
        await page.waitForSelector('body', { timeout: 10000 });

        // Attach console listener BEFORE evaluate
        page.on('console', msg => {
            if (msg.text().startsWith('DEBUG')) {
                console.log(msg.text());
            }
        });

        console.log('Extracting data...');
        const runners = await page.evaluate(() => {
            const data = [];
            // Use the class prefix found in debug: RunnersTableRow_divTableRow
            const rows = Array.from(document.querySelectorAll("div[class*='RunnersTableRow_divTableRow']"));

            if (rows.length === 0) {
                return { error: "No rows found. Dump: " + document.body.innerText.substring(0, 200) };
            }

            rows.forEach(row => {
                const cells = Array.from(row.querySelectorAll("div[class*='RunnersTableRow_divTableCell']"));

                // Name is in cell 1 (usually)
                const nameEl = row.querySelector("[class*='RunnersTableRow_runner_horse_name']");
                const name = nameEl ? nameEl.innerText.trim() : null;

                // Form is in cell 0: "28(0) 23-111" -> want "23-111"
                // It might be just the form if no number, or mixed. 
                // Regex for form: containing digits, hyphens, P, F, U, B, C, R, O
                let form = null;
                if (cells[0]) {
                    const text = cells[0].innerText.trim();
                    // Match the form part: bits like 123-111, or 1P-2
                    const match = text.match(/[\d\-PUFBCRO]+/g);
                    // The last match is usually the current form
                    if (match && match.length > 0) {
                        form = match[match.length - 1];
                    }
                }

                // Trainer
                let trainer = null;
                const trainerEl = row.querySelector("[class*='RunnersTableRow_trainer_name']");
                if (trainerEl) {
                    trainer = trainerEl.innerText.trim();
                } else {
                    // Fallback 
                    if (cells[4]) trainer = cells[4].innerText.replace('T:', '').trim();
                }

                // RPR is usually cell 8 (or cells.length - 2)
                let rpr = null;
                let age = null;
                let officialRating = null;

                // Structure based on debug:
                // [0:Cloth] [1:Name] [2:Select] [3:Odds] [4:Trainer] [5:Age] [6:Wgt] [7:OR] [8:RPR]

                if (cells.length >= 9) {
                    age = cells[5] ? cells[5].innerText.replace(/\n/g, '').trim() : null;
                    officialRating = cells[7] ? cells[7].innerText.replace(/\n/g, '').trim() : null;
                    rpr = cells[8] ? cells[8].innerText.replace(/\n/g, '').trim() : null;

                    // DEBUG LOGGING
                    if (data.length < 3) {
                        console.log(`DEBUG: Row ${data.length + 1} (${name}) - Cells: ${cells.length}`);
                        console.log(`DEBUG: Cell[5] (Age): "${cells[5] ? cells[5].innerText : 'N/A'}"`);
                        console.log(`DEBUG: Cell[7] (OR): "${cells[7] ? cells[7].innerText : 'N/A'}"`);
                        console.log(`DEBUG: Cell[8] (RPR): "${cells[8] ? cells[8].innerText : 'N/A'}"`);
                        console.log(`DEBUG: Cell[9] (Poss Jockey): "${cells[9] ? cells[9].innerText : 'N/A'}"`);
                    }
                }

                if (name) {
                    data.push({ name, form, trainer, rpr, age, officialRating });
                }
            });
            return data;
        });

        if (runners.error) {
            console.error("Scrape failed logic:", runners.error);
        } else {
            console.log(`Found ${runners.length} runners.`);
            console.log(JSON.stringify(runners, null, 2));
        }

        return runners;

    } catch (error) {
        console.error('Error scraping Racing Post:', error);
        try {
            const html = await page.content();
            console.log("HTML Snapshot on error:", html.substring(0, 500));
        } catch (e) { }
    } finally {
        await browser.close();
    }
}

scrapeRacingPost();
