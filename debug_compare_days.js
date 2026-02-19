const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const RACES = {
    'tuesday_supreme': 'https://www.oddschecker.com/cheltenham-festival/supreme-novices-hurdle/winner',
    'wednesday_ballymore': 'https://www.oddschecker.com/cheltenham-festival/gallagher-novices-hurdle/winner',
    'wednesday_coral': 'https://www.oddschecker.com/cheltenham-festival/coral-cup/winner'
};

async function scrapeAndCompare(label, url) {
    console.log(`\n🔍 TESTING: ${label}`);
    console.log(`   URL: ${url}`);

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
            'Referer': 'https://www.google.co.uk/'
        });

        // Navigate
        const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        console.log(`   Status: ${response.status()}`);
        console.log(`   Title: ${await page.title()}`);

        // Check essential selectors
        const selectors = [
            'h1',
            '.eventTableHeader',
            'tr.diff-row',
            'a.selTxt', // Horse name link
            'td.bc'     // Odds cell
        ];

        for (const sel of selectors) {
            const el = await page.$(sel);
            const count = (await page.$$(sel)).length;
            if (el) {
                console.log(`   ✅ Found '${sel}': ${count} instances.`);
                if (sel === 'h1') console.log(`      H1 Text: "${await page.evaluate(e => e.innerText, el)}"`);
            } else {
                console.error(`   ❌ MISSING '${sel}'`);
            }
        }

        // Dump full HTML if missing rows
        const rows = await page.$$('tr.diff-row');
        if (rows.length === 0) {
            const fs = require('fs');
            const filename = `debug_${label}.html`;
            fs.writeFileSync(filename, await page.content());
            console.log(`   ❌ HTML Dump saved to ${filename} for analysis.`);
        }

    } catch (error) {
        console.error(`   💀 CRITICAL ERROR: ${error.message}`);
    } finally {
        await browser.close();
    }
}

(async () => {
    // 1. Test the "Good" Tuesday race
    await scrapeAndCompare('TUESDAY_SUPREME', RACES.tuesday_supreme);

    // 2. Test the "Bad" Wednesday races
    await scrapeAndCompare('WEDNESDAY_BALLYMORE', RACES.wednesday_ballymore);
    await scrapeAndCompare('WEDNESDAY_CORAL', RACES.wednesday_coral);
})();
