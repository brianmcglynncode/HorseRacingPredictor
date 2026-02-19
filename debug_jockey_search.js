const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function debugJockey() {
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
            const row = document.querySelector("div[class*='RunnersTableRow_divTableRow']");
            if (!row) return "No row found";

            // Search for any element with 'jockey' in class name
            const jockeyEls = Array.from(row.querySelectorAll("*")).filter(el =>
                el.className && typeof el.className === 'string' && el.className.toLowerCase().includes('jockey')
            );

            return {
                rowHtml: row.innerHTML,
                jockeyMatches: jockeyEls.map(el => ({ tag: el.tagName, class: el.className, text: el.innerText }))
            };
        });

        console.log('Jockey Matches:', JSON.stringify(debugData.jockeyMatches, null, 2));
        // console.log('Row InnerHTML:', debugData.rowHtml);

    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
}

debugJockey();
