const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

// --- ANTI-BLOCKING CONFIGURATION (2026 Best Practices) ---

// UPDATED: Current Chrome/Firefox/Edge versions (Feb 2026)
const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:134.0) Gecko/20100101 Firefox/134.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0"
];

// VIEWPORT RANDOMIZATION: Real users have different screen sizes
const VIEWPORTS = [
    { width: 1920, height: 1080 },
    { width: 1536, height: 864 },
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
    { width: 1280, height: 800 },
    { width: 1680, height: 1050 },
];

// Add your proxy servers here (e.g., 'http://user:pass@IP:PORT')
const PROXIES = [
    // 'http://username:password@1.2.3.4:8080',
];

// REFERRER VARIATION: Don't always come from Google
const REFERRERS = [
    'https://www.google.co.uk/',
    'https://www.google.com/',
    'https://www.google.co.uk/search?q=cheltenham+festival+odds',
    'https://www.bing.com/',
    'https://www.bing.com/search?q=cheltenham+odds',
    '',  // Direct navigation (no referrer) — some real users type URLs
    'https://t.co/abc123',  // Looks like Twitter/X link click
];

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

puppeteer.use(StealthPlugin());

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function scrapeWithRetry(url, scrapeFunction, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        const userAgent = getRandomElement(USER_AGENTS);
        const viewport = getRandomElement(VIEWPORTS);
        const proxy = PROXIES.length > 0 ? getRandomElement(PROXIES) : null;

        const launchArgs = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            `--window-size=${viewport.width},${viewport.height}`,
            '--disable-blink-features=AutomationControlled',
            `--user-agent=${userAgent}`,
            '--disable-dev-shm-usage',    // Prevent crashes on Railway
            '--disable-gpu',               // Not needed for headless
            '--lang=en-GB',                // UK locale
            '--disable-extensions',
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

            // RANDOMIZED VIEWPORT (not always 1920x1080)
            await page.setViewport({
                width: viewport.width,
                height: viewport.height,
                deviceScaleFactor: Math.random() > 0.5 ? 1 : 2
            });

            // BLOCK UNNECESSARY RESOURCES: Faster + smaller fingerprint
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                const type = req.resourceType();
                if (['image', 'stylesheet', 'font', 'media'].includes(type)) {
                    req.abort();
                } else {
                    req.continue();
                }
            });

            // REALISTIC HEADERS: Vary the referrer each session
            const referrer = getRandomElement(REFERRERS);
            const headers = {
                'Accept-Language': 'en-GB,en;q=0.9',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'DNT': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1'
            };
            if (referrer) {
                headers['Referer'] = referrer;
                headers['Sec-Fetch-Site'] = referrer.includes(new URL(url).hostname) ? 'same-origin' : 'cross-site';
            } else {
                headers['Sec-Fetch-Site'] = 'none'; // Direct navigation
            }
            await page.setExtraHTTPHeaders(headers);

            // NAVIGATOR OVERRIDES: Match a real UK Chrome browser
            await page.evaluateOnNewDocument(() => {
                // Timezone: Europe/London
                Object.defineProperty(Intl.DateTimeFormat.prototype, 'resolvedOptions', {
                    value: function () {
                        return { timeZone: 'Europe/London', locale: 'en-GB' };
                    }
                });

                // Languages
                Object.defineProperty(navigator, 'languages', { get: () => ['en-GB', 'en'] });
                Object.defineProperty(navigator, 'language', { get: () => 'en-GB' });

                // Hardware: look like a real machine
                Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
                Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });

                // Platform: match the User-Agent
                Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });

                // Plugins: Chrome has some by default
                Object.defineProperty(navigator, 'plugins', {
                    get: () => [
                        { name: 'Chrome PDF Viewer', filename: 'internal-pdf-viewer' },
                        { name: 'Chromium PDF Viewer', filename: 'internal-pdf-viewer' },
                    ]
                });

                // WebGL Vendor: look like real GPU
                const getParameter = WebGLRenderingContext.prototype.getParameter;
                WebGLRenderingContext.prototype.getParameter = function (parameter) {
                    if (parameter === 37445) return 'Google Inc. (Intel)';
                    if (parameter === 37446) return 'ANGLE (Intel, Intel(R) UHD Graphics 630, OpenGL 4.5)';
                    return getParameter.call(this, parameter);
                };
            });

            // RANDOM DELAY BEFORE NAVIGATION (3-8 seconds)
            const setupDelay = Math.floor(Math.random() * 5000) + 3000;
            await delay(setupDelay);

            // WARM-UP NAVIGATION: Visit homepage first (50% of the time)
            // Real users browse homepage → race page, not teleport to deep URLs
            const domain = new URL(url).origin;
            if (Math.random() > 0.5) {
                console.log(`  🏠 Warm-up: Visiting ${domain} first...`);
                try {
                    await page.goto(domain, { waitUntil: 'domcontentloaded', timeout: 20000 });
                    await delay(2000 + Math.random() * 3000); // Browse homepage briefly
                    await page.mouse.move(Math.floor(Math.random() * 500), Math.floor(Math.random() * 400));
                    await page.evaluate(() => window.scrollBy({ top: 200, behavior: 'smooth' }));
                    await delay(1000 + Math.random() * 2000);
                } catch (e) {
                    // Homepage warm-up failed, continue to target anyway
                }
            }

            console.log(`  Attempt ${i + 1}/${maxRetries}: Navigating to target page...`);
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

            // HUMANIZE: Realistic interaction pattern
            await humanizePage(page);

            // DISMISS COOKIE BANNERS (common detection signal if ignored)
            await dismissCookieBanner(page);

            const data = await scrapeFunction(page);

            if (data) {
                return data;
            } else {
                throw new Error("Scraper returned null/empty data");
            }

        } catch (error) {
            console.error(`Attempt ${i + 1} failed: ${error.message}`);
            if (i === maxRetries - 1) throw error;

            // Exponential Backoff
            const retryDelay = 15000 + (i * 10000); // 15s, 25s, 35s
            console.log(`Waiting ${(retryDelay / 1000)}s before retry...`);
            await delay(retryDelay);
        } finally {
            await browser.close();
        }
    }
}

// COOKIE BANNER DISMISSAL: Bots that ignore cookie banners are flagged
async function dismissCookieBanner(page) {
    try {
        const cookieSelectors = [
            'button[id*="accept"]',
            'button[class*="accept"]',
            'button[class*="consent"]',
            'button[class*="agree"]',
            'a[id*="accept"]',
            '#onetrust-accept-btn-handler',
            '.cookie-accept',
            '[data-testid="cookie-accept"]',
            'button[title="Accept"]',
            'button[title="Accept All"]',
            'button[aria-label*="accept"]',
            'button[aria-label*="Accept"]'
        ];

        for (const selector of cookieSelectors) {
            const btn = await page.$(selector);
            if (btn) {
                await delay(500 + Math.random() * 1000); // Pause before clicking like a human
                await btn.click();
                console.log(`  🍪 Dismissed cookie banner (${selector})`);
                await delay(500);
                break;
            }
        }
    } catch (e) {
        // Ignore — banner may not exist
    }
}

// REALISTIC HUMAN BEHAVIOR: Multiple interactions, varied timing
async function humanizePage(page) {
    try {
        // 1. Initial pause (reading the page)
        await delay(1000 + Math.random() * 2000);

        // 2. Mouse moves to random positions (2-4 moves)
        const moves = 2 + Math.floor(Math.random() * 3);
        for (let m = 0; m < moves; m++) {
            await page.mouse.move(
                100 + Math.floor(Math.random() * 800),
                100 + Math.floor(Math.random() * 600)
            );
            await delay(200 + Math.random() * 500);
        }

        // 3. Gradual scroll down (like actually reading)
        const scrollSteps = 2 + Math.floor(Math.random() * 3);
        for (let s = 0; s < scrollSteps; s++) {
            const scrollAmount = 100 + Math.floor(Math.random() * 300);
            await page.evaluate((amount) => {
                window.scrollBy({ top: amount, behavior: 'smooth' });
            }, scrollAmount);
            await delay(500 + Math.random() * 1500);
        }

        // 4. Sometimes scroll back up a bit (natural behavior)
        if (Math.random() > 0.6) {
            await page.evaluate(() => {
                window.scrollBy({ top: -150, behavior: 'smooth' });
            });
            await delay(300 + Math.random() * 500);
        }

        // 5. Final pause before scraping
        await delay(500 + Math.random() * 1000);

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
                let spotlight = "";

                if (cells.length >= 9) {
                    age = cells[5] ? cells[5].innerText.replace(/\n/g, '').trim() : null;
                    weight = cells[6] ? cells[6].innerText.replace(/\n/g, '').trim() : null;
                    officialRating = cells[7] ? cells[7].innerText.replace(/\n/g, '').trim() : null;
                    rpr = cells[8] ? cells[8].innerText.replace(/\n/g, '').trim() : null;
                }

                // Spotlight / Comment Extraction (Hidden in new RP layout, check for expandable or specific class)
                const commentEl = row.querySelector('.RunnersTableRow_spotlight__text') || row.querySelector('td.comment');
                if (commentEl) {
                    spotlight = commentEl.innerText.trim();
                }

                if (name) data.push({ name, form, trainer, jockey, courseDistanceWin, rpr, age, weight, officialRating, spotlight });
            });

            // Extract Current Going from Page Header
            // Often "Good to Soft" etc.
            const goingEl = document.querySelector('.RaceHeader_going__info') || document.querySelector('.Rp-RaceHeader__going');
            const raceGoing = goingEl ? goingEl.innerText.trim() : "Unknown";

            // Attach going to first horse (hacky but works for whole race context)
            if (data.length > 0) data[0].raceGoing = raceGoing;

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
            console.log('Merging Expert Data & Social Discovery...');
            const discovery = require('./discovery');

            for (const horse of oddsCheckerData.horses) {
                // 1. Merge Expert Stats (Racing Post)
                const expertHorse = expertData.find(e => normalize(e.name) === normalize(horse.name));
                if (expertHorse) {
                    horse.form = expertHorse.form;
                    horse.trainer = expertHorse.trainer;
                    horse.jockey = expertHorse.jockey;
                    horse.courseDistanceWin = expertHorse.courseDistanceWin;
                    horse.rpr = expertHorse.rpr;
                    horse.age = expertHorse.age;
                    horse.weight = expertHorse.weight;
                    horse.officialRating = expertHorse.officialRating;
                    horse.spotlight = expertHorse.spotlight;
                }

                // 2. Perform Deep Social Research (X / Reddit / Forums)
                const insights = await discovery.getSocialInsights(horse.name);
                horse.socialInsights = insights.social;
                horse.forumData = insights.forum;
            }

            // Attach race going if available
            if (expertData[0] && expertData[0].raceGoing) {
                oddsCheckerData.raceGoing = expertData[0].raceGoing;
            }
            console.log("Deep Merge complete.");
        }

        return [oddsCheckerData];

    } catch (error) {
        console.error('Main Scraper Error:', error);
        // Return empty array instead of crashing, app.js handles empty
        return [];
    }
}

module.exports = { scrapeCheltenhamFestival };
