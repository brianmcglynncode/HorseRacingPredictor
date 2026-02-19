const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function debugOddsChecker() {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    try {
        const url = 'https://www.oddschecker.com/cheltenham-festival/supreme-novices-hurdle/winner';
        console.log(`Navigating to ${url}...`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

        console.log('Evaluating page...');
        const debugInfo = await page.evaluate(() => {
            const rows = document.querySelectorAll('tr.diff-row');
            if (rows.length === 0) return { error: "No rows found with tr.diff-row" };

            const firstRow = rows[0];
            return {
                html: firstRow.outerHTML,
                oddsCellsCount: firstRow.querySelectorAll('td[data-oddf]').length,
                allCellsCount: firstRow.querySelectorAll('td').length
            };
        });

        console.log('Debug Info:', debugInfo);

    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
}

debugOddsChecker();
