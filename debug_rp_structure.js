const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function debugRacingPost() {
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
            if (rows.length === 0) return "No rows found";

            // Return HTML of the first row to analyze structure
            return {
                html: rows[0].outerHTML,
                text: rows[0].innerText
            };
        });

        console.log('Row HTML:', debugData.html);
        console.log('Row Text:', debugData.text);

    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
}

debugRacingPost();
