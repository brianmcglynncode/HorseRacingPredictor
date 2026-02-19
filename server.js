const express = require('express');
const { scrapeCheltenhamFestival } = require('./scraper');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

const fs = require('fs');
const path = require('path');

// Race Configuration Map (Full Festival Card)
const RACES = {
    // --- TUESDAY (Day 1) ---
    'supreme': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/supreme-novices-hurdle/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/supreme-novices-hurdle/'
    },
    'arkle': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/arkle-chase/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/arkle-novices-chase/'
    },
    'ultima': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/ultima-handicap-chase/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/ultima-handicap-chase/'
    },
    'champion': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/champion-hurdle/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/champion-hurdle/'
    },
    'mares': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/mares-hurdle/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/mares-hurdle/'
    },
    'boodles': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/hallgarten-and-novum-wines-juvenile-handicap-hurdle/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/boodles-juvenile-handicap-hurdle/'
    },
    'national': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/national-hunt-novices-chase/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/national-hunt-chase/'
    },

    // --- WEDNESDAY (Day 2) ---
    'ballymore': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/gallagher-novices-hurdle/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/gallagher-novices-hurdle/'
    },
    'brown': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/brown-advisory-novices-chase/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/brown-advisory-novices-chase/'
    },
    'coral': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/coral-cup/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/coral-cup/'
    },
    'championchase': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/queen-mother-champion-chase/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/queen-mother-champion-chase/'
    },
    'cross': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/cross-country-chase/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/cross-country-chase/'
    },
    'grandannual': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/grand-annual-chase/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/grand-annual-chase/'
    },
    'bumper': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/champion-bumper/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/champion-bumper/'
    },

    // --- THURSDAY (Day 3) ---
    'turners': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/turners-novices-chase/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/turners-novices-chase/'
    },
    'pertemps': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/pertemps-network-final/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/pertemps-network-final/'
    },
    'ryanair': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/ryanair-chase/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/ryanair-chase/'
    },
    'stayers': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/stayers-hurdle/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/stayers-hurdle/'
    },
    'plate': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/festival-plate/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/improving-handicap-chase/' // Often plate
    },
    'maresnovice': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/mares-novices-hurdle/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/mares-novices-hurdle/'
    },
    'kimmuir': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/kim-muir-challenge-cup/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/kim-muir-challenge-cup/'
    },

    // --- FRIDAY (Day 4) ---
    'triumph': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/triumph-hurdle/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/triumph-hurdle/'
    },
    'county': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/county-hurdle/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/county-handicap-hurdle/'
    },
    'bartlett': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/albert-bartlett-novices-hurdle/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/albert-bartlett-novices-hurdle/'
    },
    'goldcup': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/cheltenham-gold-cup/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/cheltenham-gold-cup/'
    },
    'hunters': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/foxhunter-chase/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/st-james-s-place-festival-hunter-chase/'
    },
    'mareschase': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/mares-chase/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/mares-chase/'
    },
    'martinpipe': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/martin-pipe-handicap-hurdle/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/martin-pipe-conditional-jockeys-handicap-hurdle/'
    }
};

const HISTORY_FILE = path.join(__dirname, 'history.json');
let raceHistory = { races: {} };

// Load history on startup
try {
    if (fs.existsSync(HISTORY_FILE)) {
        raceHistory = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    }
} catch (err) {
    console.error("Error loading history:", err);
}

function saveHistory() {
    try {
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(raceHistory, null, 2));
    } catch (err) {
        console.error("Error saving history:", err);
    }
}

function getBestOdds(horse) {
    // Helper to find best decimal odds from bookmakers
    let best = 0;
    if (horse.odds) {
        Object.values(horse.odds).forEach(o => {
            if (o.decimal > best) best = o.decimal;
        });
    }
    return best;
}

function processRaceData(raceId, scrapedData) {
    const now = new Date().toISOString();

    // Ensure race entry exists
    if (!raceHistory.races[raceId]) {
        raceHistory.races[raceId] = {
            openingLines: {},
            lastUpdated: null,
            latestData: null
        };
    }

    const history = raceHistory.races[raceId];
    const raceData = scrapedData[0]; // Assuming single race array

    if (!raceData || !raceData.horses) return scrapedData;

    // 1. Set Opening Lines if not set (Baseline)
    let isFirstRun = Object.keys(history.openingLines).length === 0;

    raceData.horses.forEach(horse => {
        const bestOdds = getBestOdds(horse);
        const name = horse.name;

        // If first run or new horse, set opening line
        if (!history.openingLines[name] && bestOdds > 0) {
            history.openingLines[name] = bestOdds;
            // Initialize velocity tracking
            if (!history.velocityTracking) history.velocityTracking = {};
            history.velocityTracking[name] = { lastOdds: bestOdds, lastTime: Date.now() };
        }

        const open = history.openingLines[name];

        // 2. Identify Steamers and Drifters (Classic)
        if (open && bestOdds > 0) {
            if (bestOdds < open) {
                horse.marketMove = 'steamer';
                horse.movePercent = Math.round(((open - bestOdds) / open) * 100);
            } else if (bestOdds > open) {
                horse.marketMove = 'drifter';
                horse.movePercent = Math.round(((bestOdds - open) / open) * 100);
            } else {
                horse.marketMove = 'stable';
            }
            horse.openingOdds = open;
        }

        // 3. VELOCITY TRACKING (Smart Money Detector)
        // Calculate points dropped per minute
        if (history.velocityTracking && history.velocityTracking[name]) {
            const track = history.velocityTracking[name];
            const nowTime = Date.now();
            const timeDiffMinutes = (nowTime - track.lastTime) / 60000;

            if (timeDiffMinutes > 0.5) { // Only update velocity if enough time passed
                const oddsDiff = bestOdds - track.lastOdds;
                // Velocity = Points per Minute
                // Negative = Steaming (Dropping)
                const velocity = oddsDiff / timeDiffMinutes;

                horse.velocity = velocity; // Sent to frontend

                // Update tracker
                track.lastOdds = bestOdds;
                track.lastTime = nowTime;
            } else {
                // Keep previous velocity if too soon to update
                horse.velocity = 0;
            }
        }
    });

    // Save snapshot
    history.latestData = scrapedData;
    history.lastUpdated = now;
    saveHistory();

    return scrapedData;
}

// Background Scraper Loop (The Time Machine Engine)
async function startBackgroundScraper() {
    console.log("🕰️ Time Machine: Starting background scraper loop...");

    const runScrapeLoop = async () => {
        console.log("🕰️ Time Machine: Hourly update triggered.");
        // Prioritize Wednesday races (Day 2) to ensure data is fresh
        const wednesdayRaces = ['ballymore', 'brown', 'coral', 'championchase', 'cross', 'grandannual', 'bumper'];
        const otherRaces = Object.keys(RACES).filter(r => !wednesdayRaces.includes(r));
        const raceIds = [...wednesdayRaces, ...otherRaces];

        for (const raceId of raceIds) {
            try {
                const raceConfig = RACES[raceId];
                console.log(`🕰️ Update: Scraping ${raceId}...`);
                const data = await scrapeCheltenhamFestival(raceConfig.oc, raceConfig.rp);

                if (data && data.length > 0) {
                    processRaceData(raceId, data);
                    console.log(`✅ Update: Saved snapshot for ${raceId}`);
                }

                // RANDOM DELAY BETWEEN RACES (30s - 90s)
                // Breaks fixed pattern
                const raceDelay = Math.floor(Math.random() * 60000) + 30000;
                console.log(`⏳ Waiting ${(raceDelay / 1000).toFixed(1)}s before next race...`);
                await new Promise(r => setTimeout(r, raceDelay));

            } catch (e) {
                console.error(`❌ Update Failed for ${raceId}:`, e);
                // Wait longer on error
                await new Promise(r => setTimeout(r, 60000));
            }
        }

        // SCHEDULE NEXT RUN (Randomized: 50 - 70 minutes)
        // Breaks fixed hourly pattern
        // Base 1 hour +/- 10 mins
        const nextRunDelay = (1000 * 60 * 60) + (Math.floor(Math.random() * (1000 * 60 * 20)) - (1000 * 60 * 10));

        console.log(`💤 Sleeping for ${(nextRunDelay / 1000 / 60).toFixed(1)} minutes until next cycle...`);
        setTimeout(runScrapeLoop, nextRunDelay);
    };

    // Run IMMEDIATELY on startup
    runScrapeLoop();
}

// Start the engine
startBackgroundScraper();

app.get('/api/scrape', async (req, res) => {
    try {
        let raceId = req.query.raceId || 'supreme';
        raceId = raceId.trim(); // Sanitize input

        const raceConfig = RACES[raceId];

        if (!raceConfig) {
            return res.status(400).json({ success: false, error: 'Invalid race ID' });
        }

        // Check cache first
        let history = raceHistory.races[raceId];

        // ROBUSTNESS FIX: If not in memory, try reloading from disk once
        if (!history || !history.latestData) {
            console.log(`⚠️ Memory Miss for ${raceId}: Checking disk for latest history...`);
            try {
                if (fs.existsSync(HISTORY_FILE)) {
                    const diskHistory = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
                    if (diskHistory.races && diskHistory.races[raceId]) {
                        console.log(`✅ Disk Hit! Loaded ${raceId} from history.json`);
                        raceHistory = diskHistory; // Sync memory with disk
                        history = raceHistory.races[raceId];
                    }
                }
            } catch (e) {
                console.error("Failed to reload history from disk:", e);
            }
        }

        // POLICY: Always serve cached data if it exists. 
        // We rely on the background scraper loop to update it every hour.
        // This ensures the user sees data INSTANTLY (sub-10ms) instead of waiting 10-20s.
        if (history && history.latestData) {
            console.log(`⚡ Time Machine: Serving snapshot for ${raceId} (Last updated: ${history.lastUpdated})`);
            return res.json({ success: true, data: history.latestData, lastUpdated: history.lastUpdated, cached: true });
        }

        // Only scrape live if we have NEVER scraped this race before (Cold Start)
        console.log(`Starting Cold Start Scrape for ${raceId} (No history found)...`);

        // Timeout Promise to enforce 45s max wait (Increased for Anti-Bot Delays)
        const timeoutMs = 45000;
        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Scrape timeout exceeded ${timeoutMs}ms`)), timeoutMs)
        );

        try {
            // Race the scrape against the timeout
            const data = await Promise.race([
                scrapeCheltenhamFestival(raceConfig.oc, raceConfig.rp),
                timeout
            ]);

            // Process and save
            const processedData = processRaceData(raceId, data);
            res.json({ success: true, data: processedData, lastUpdated: new Date().toISOString(), cached: false });

        } catch (error) {
            console.error(`Scrape failed or timed out for ${raceId}:`, error);

            // If it timed out but we have ANY old data (edge case), return that? 
            // Currently we already returned above if history existed.
            // So this is a true failure on a fresh race.
            res.status(500).json({
                success: false,
                error: "Data retrieval timed out. Please try again in a moment as background scraping continues."
            });
        }

    } catch (error) {
        console.error('Scrape failed:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Horse Racing Predictor running at http://0.0.0.0:${port}`);
});
