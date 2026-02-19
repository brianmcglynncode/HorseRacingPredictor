const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function debugNameCell() {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
    });
    const page = await browser.newPage();

    try {
        const url = 'https://www.racingpost.com/cheltenham-festival/supreme-novices-hurdle/';
        console.log(`Navigating to ${url}...`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForSelector("div[class*='RunnersTableRow_divTableRow']", { timeout: 10000 });

        const debugData = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll("div[class*='RunnersTableRow_divTableRow']"));

            return rows.slice(0, 5).map(row => {
                const nameEl = row.querySelector("[class*='RunnersTableRow_runner_horse_name']");

                // Get the parent of name el to see if C/D badges are siblings
                const parent = nameEl ? nameEl.parentElement : null;
                const grandParent = parent ? parent.parentElement : null;

                return {
                    nameText: nameEl ? nameEl.innerText : 'N/A',
                    parentHtml: parent ? parent.innerHTML : 'N/A',
                    grandParentText: grandParent ? grandParent.innerText : 'N/A' // Might contain "CD" text
                };
            });
        });

        console.log('Name Checks:', JSON.stringify(debugData, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
}

debugNameCell();
