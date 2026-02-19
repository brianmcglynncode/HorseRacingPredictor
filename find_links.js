const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function findRaceLinks() {
    console.log(`\n🔍 Scanning Oddschecker for Valid Race Links...`);
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    try {
        await page.goto('https://www.oddschecker.com/cheltenham-festival', { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Find ALL links on the page within the race schedule grid
        const links = await page.$$eval('a', as => as.map(a => ({ text: a.innerText, href: a.href })));

        console.log(`\n✅ Found ${links.length} total links.`);

        const raceLinks = links.filter(l => l.href.includes('cheltenham-festival/'));
        console.log(`\n✅ Filtered to ${raceLinks.length} race links:`);

        raceLinks.forEach(l => {
            // Log clean links
            if (l.text.length > 3 && !l.href.includes('#')) {
                console.log(`- [${l.text.trim()}] -> ${l.href}`);
            }
        });

    } catch (error) {
        console.error(`Fatal Error: ${error.message}`);
    } finally {
        await browser.close();
    }
}

findRaceLinks();
