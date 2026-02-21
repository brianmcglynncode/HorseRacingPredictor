const express = require('express');
const { scrapeCheltenhamFestival } = require('./scraper');
const narrativeEngine = require('./narrativeEngine');
const discovery = require('./discovery');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

const fs = require('fs');
const path = require('path');

// Race Configuration Map (Full Festival Card with Start Times)
const RACES = {
    // --- TUESDAY (Day 1: March 10, 2026) ---
    'supreme': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/supreme-novices-hurdle/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/supreme-novices-hurdle/',
        startTime: '2026-03-10T13:30:00Z'
    },
    'arkle': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/arkle-chase/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/arkle-novices-chase/',
        startTime: '2026-03-10T14:10:00Z'
    },
    'ultima': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/ultima-handicap-chase/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/ultima-handicap-chase/',
        startTime: '2026-03-10T14:50:00Z'
    },
    'champion': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/champion-hurdle/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/champion-hurdle/',
        startTime: '2026-03-10T15:30:00Z'
    },
    'mares': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/mares-hurdle/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/mares-hurdle/',
        startTime: '2026-03-10T16:10:00Z'
    },
    'boodles': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/hallgarten-and-novum-wines-juvenile-handicap-hurdle/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/boodles-juvenile-handicap-hurdle/',
        startTime: '2026-03-10T16:50:00Z'
    },
    'national': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/national-hunt-novices-chase/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/national-hunt-chase/',
        startTime: '2026-03-10T17:30:00Z'
    },

    // --- WEDNESDAY (Day 2: March 11, 2026) ---
    'ballymore': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/gallagher-novices-hurdle/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/gallagher-novices-hurdle/',
        startTime: '2026-03-11T13:30:00Z'
    },
    'brown': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/brown-advisory-novice-chase/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/brown-advisory-novices-chase/',
        startTime: '2026-03-11T14:10:00Z'
    },
    'coral': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/coral-cup-handicap-hurdle/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/coral-cup/',
        startTime: '2026-03-11T14:50:00Z'
    },
    'championchase': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/champion-chase/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/queen-mother-champion-chase/',
        startTime: '2026-03-11T15:30:00Z'
    },
    'cross': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/cross-country-chase/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/cross-country-chase/',
        startTime: '2026-03-11T16:10:00Z'
    },
    'grandannual': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/grand-annual-chase/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/grand-annual-chase/',
        startTime: '2026-03-11T16:50:00Z'
    },
    'bumper': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/champion-bumper/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/champion-bumper/',
        startTime: '2026-03-11T17:30:00Z'
    },

    // --- THURSDAY (Day 3: March 12, 2026) ---
    'turners': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/turners-novices-hurdle/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/turners-novices-chase/',
        startTime: '2026-03-12T13:30:00Z'
    },
    'pertemps': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/pertemps-network-final/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/pertemps-network-final/',
        startTime: '2026-03-12T14:10:00Z'
    },
    'ryanair': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/ryanair-chase/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/ryanair-chase/',
        startTime: '2026-03-12T14:50:00Z'
    },
    'stayers': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/stayers-hurdle/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/stayers-hurdle/',
        startTime: '2026-03-12T15:30:00Z'
    },
    'plate': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/trustatrader-plate/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/improving-handicap-chase/',
        startTime: '2026-03-12T16:10:00Z'
    },
    'maresnovice': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/mares-novices-hurdle/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/mares-novices-hurdle/',
        startTime: '2026-03-12T16:50:00Z'
    },
    'kimmuir': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/kim-muir-challenge-cup/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/kim-muir-challenge-cup/',
        startTime: '2026-03-12T17:30:00Z'
    },

    // --- FRIDAY (Day 4: March 13, 2026) ---
    'triumph': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/triumph-hurdle/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/triumph-hurdle/',
        startTime: '2026-03-13T13:30:00Z'
    },
    'county': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/county-hurdle/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/county-handicap-hurdle/',
        startTime: '2026-03-13T14:10:00Z'
    },
    'bartlett': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/albert-bartlett-novices-hurdle/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/albert-bartlett-novices-hurdle/',
        startTime: '2026-03-13T14:50:00Z'
    },
    'goldcup': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/cheltenham-gold-cup/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/cheltenham-gold-cup/',
        startTime: '2026-03-13T15:30:00Z'
    },
    'hunters': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/hunters-chase/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/st-james-s-place-festival-hunter-chase/',
        startTime: '2026-03-13T16:10:00Z'
    },
    'mareschase': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/mares-chase/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/mares-chase/',
        startTime: '2026-03-13T16:50:00Z'
    },
    'martinpipe': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/martin-pipe-handicap-hurdle/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/martin-pipe-conditional-jockeys-handicap-hurdle/',
        startTime: '2026-03-13T17:30:00Z'
    },

    // --- SPECIAL RACES ---
    'southwell730': {
        oc: 'https://www.oddschecker.com/horse-racing/southwell/19:30/winner',
        rp: 'https://www.racingpost.com/racecards/59/southwell-aw/2026-02-20/904206',
        startTime: '2026-02-20T19:30:00Z'
    }
};

require('dotenv').config();
const { Pool } = require('pg');

const HISTORY_FILE = path.join(__dirname, 'history.json');
let raceHistory = { races: {} };

let pool = null;
if (process.env.DATABASE_URL) {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    pool.query(`
        CREATE TABLE IF NOT EXISTS race_history (
            id VARCHAR(50) PRIMARY KEY,
            data JSONB NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `).then(() => console.log('🐘 PostgreSQL Database Initialized'))
        .catch(err => console.error('❌ PostgreSQL Init Error:', err.message));
}

async function loadHistory() {
    if (pool) {
        try {
            // First pass: try migrating local data if table exists but empty
            if (fs.existsSync(HISTORY_FILE)) {
                console.log('📦 Checking if migration from local history.json to Postgres is needed...');
                const rawData = fs.readFileSync(HISTORY_FILE, 'utf8');
                const historyJson = JSON.parse(rawData);

                if (historyJson.races && Object.keys(historyJson.races).length > 0) {
                    for (const rId of Object.keys(historyJson.races)) {
                        try {
                            // Only insert if it doesn't already exist to prevent overwriting new cloud data
                            await pool.query(
                                `INSERT INTO race_history (id, data, updated_at) VALUES ($1, $2, NOW())
                                 ON CONFLICT (id) DO NOTHING`,
                                [rId, historyJson.races[rId]]
                            );
                        } catch (err) {
                            console.error(`❌ Migration check failed for ${rId}:`, err.message);
                        }
                    }
                    console.log('✅ Migration check complete.');
                }
            }

            const res = await pool.query('SELECT id, data FROM race_history');
            for (const row of res.rows) {
                raceHistory.races[row.id] = row.data;
            }
            console.log(`🐘 Loaded ${res.rowCount} races from PostgreSQL.`);
            return;
        } catch (e) {
            console.error('Failed to load from PostgreSQL:', e.message);
        }
    }

    // Fallback to JSON
    try {
        if (fs.existsSync(HISTORY_FILE)) {
            raceHistory = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
            console.log('📄 Loaded history from local JSON fallback.');
        }
    } catch (err) {
        console.error("Error loading local history:", err);
    }
}
// Trigger load
loadHistory();

async function saveHistory(raceId) {
    // 1. Save to Database if configured
    if (pool && raceId) {
        try {
            const dataToSave = raceHistory.races[raceId];
            await pool.query(
                `INSERT INTO race_history (id, data, updated_at) VALUES ($1, $2, NOW())
                 ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
                [raceId, dataToSave]
            );
        } catch (e) {
            console.error(`Error saving race ${raceId} to Postgres:`, e.message);
        }
    } else if (pool && !raceId) {
        // Bulk save if no specific raceId provided
        for (const rId of Object.keys(raceHistory.races)) {
            try {
                await pool.query(
                    `INSERT INTO race_history (id, data, updated_at) VALUES ($1, $2, NOW())
                     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
                    [rId, raceHistory.races[rId]]
                );
            } catch (e) { }
        }
    }

    // 2. Always maintain local JSON fallback
    try {
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(raceHistory, null, 2));
    } catch (err) {
        console.error("Error saving local history:", err);
    }
}

function getBestOdds(horse) {
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
    if (!raceHistory.races[raceId]) {
        raceHistory.races[raceId] = {
            openingLines: {},
            lastUpdated: null,
            latestData: null
        };
    }

    const history = raceHistory.races[raceId];
    const raceData = scrapedData[0];

    if (!raceData || !raceData.horses) return scrapedData;

    raceData.horses.forEach(horse => {
        const bestOdds = getBestOdds(horse);
        const name = horse.name;

        if (!history.openingLines[name] && bestOdds > 0) {
            history.openingLines[name] = bestOdds;
            if (!history.velocityTracking) history.velocityTracking = {};
            history.velocityTracking[name] = { lastOdds: bestOdds, lastTime: Date.now() };
        }

        const open = history.openingLines[name];
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

        if (history.velocityTracking && history.velocityTracking[name]) {
            const track = history.velocityTracking[name];
            const nowTime = Date.now();
            const timeDiffMinutes = (nowTime - track.lastTime) / 60000;
            if (timeDiffMinutes > 0.5) {
                const oddsDiff = bestOdds - track.lastOdds;
                horse.velocity = oddsDiff / timeDiffMinutes;
                track.lastOdds = bestOdds;
                track.lastTime = nowTime;
            } else {
                horse.velocity = 0;
            }
        }

        // Generate AI Reasoning (Default Official Stream)
        horse.aiReasoning = narrativeEngine.generateReasoning(horse, raceData, raceData.horses);
    });

    history.latestData = scrapedData;
    history.lastUpdated = now;
    saveHistory(raceId);
    return scrapedData;
}

// Background Scraper Loop 
let scrapeLoopRunning = false;
async function startBackgroundScraper() {
    const scheduleNext = () => {
        const nextRunDelay = (1000 * 60 * 60) + (Math.floor(Math.random() * (1000 * 60 * 20)) - (1000 * 60 * 10));
        setTimeout(() => runScrapeLoop(), nextRunDelay);
    };

    const runScrapeLoop = async () => {
        if (scrapeLoopRunning) return scheduleNext();
        scrapeLoopRunning = true;

        try {
            console.log("🕰️ Hourly Scrape triggered.");
            const allRaceIds = Object.keys(RACES);
            const subsetSize = Math.floor(allRaceIds.length * 0.7);
            const raceIds = allRaceIds.sort(() => 0.5 - Math.random()).slice(0, subsetSize);

            for (const raceId of raceIds) {
                try {
                    const data = await scrapeCheltenhamFestival(RACES[raceId].oc, RACES[raceId].rp);
                    if (data && data.length > 0) processRaceData(raceId, data);
                    await new Promise(r => setTimeout(r, 15000));
                } catch (e) {
                    console.error(`❌ Scrape failed for ${raceId}: ${e.message}`);
                }
            }
        } finally {
            scrapeLoopRunning = false;
            scheduleNext();
        }
    };

    const checkScheduledIntelligence = async () => {
        console.log("🕒 Checking Intelligence Schedule...");
        const now = new Date();
        for (const raceId in RACES) {
            const race = RACES[raceId];
            const history = raceHistory.races[raceId];
            if (!history || !history.latestData || !history.latestData[0]) continue;

            const startTime = new Date(race.startTime);
            const timeToRace = (startTime - now) / (1000 * 60 * 60);
            const lastUpdated = new Date(history.lastUpdated);
            const hoursSinceUpdate = (now - lastUpdated) / (1000 * 60 * 60);

            let needsUpdate = false;
            if (hoursSinceUpdate >= 24) needsUpdate = true;
            else if (timeToRace <= 12 && timeToRace > 10 && hoursSinceUpdate >= 2) needsUpdate = true;
            else if (timeToRace <= 5 && timeToRace > 4 && hoursSinceUpdate >= 1) needsUpdate = true;
            else if (timeToRace <= 2 && timeToRace > 1 && hoursSinceUpdate >= 0.5) needsUpdate = true; // High Intensity
            else if (timeToRace <= 1 && timeToRace > 0.5 && hoursSinceUpdate >= 0.25) needsUpdate = true; // Pre-Race Peak
            else if (timeToRace <= 0.5 && timeToRace > 0 && hoursSinceUpdate >= 0.1) needsUpdate = true; // 10-Min Final Sync

            if (needsUpdate) {
                console.log(`📡 High-Frequency Intelligence Sync for ${raceId}...`);
                const raceData = history.latestData[0];
                for (const horse of raceData.horses) {
                    const intel = await discovery.getHorseIntelligence(horse.name);
                    Object.assign(horse, intel);
                    horse.aiReasoning = narrativeEngine.generateReasoning(horse, raceData, raceData.horses);
                }
                history.lastUpdated = new Date().toISOString();
                saveHistory(raceId);
            }
        }
    };

    setInterval(checkScheduledIntelligence, 1000 * 60 * 5); // Faster check every 5 mins

    checkScheduledIntelligence();
    runScrapeLoop();
}

// API Endpoints
app.get('/api/scrape', async (req, res) => {
    let raceId = (req.query.raceId || 'supreme').trim();
    if (!RACES[raceId]) return res.status(400).json({ success: false, error: 'Invalid race' });

    let history = raceHistory.races[raceId];
    if (history && history.latestData) {
        const raceData = history.latestData[0];
        let updated = false;
        for (const horse of raceData.horses) {
            if (!horse.aiReasoning) {
                const intel = await discovery.getHorseIntelligence(horse.name);
                Object.assign(horse, intel);
                horse.aiReasoning = narrativeEngine.generateReasoning(horse, raceData, raceData.horses);
                updated = true;
            }
        }
        if (updated) saveHistory(raceId);
        return res.json({ success: true, data: history.latestData, lastUpdated: history.lastUpdated, cached: true });
    }

    res.json({ success: true, data: [], lastUpdated: null, cached: false });
});

app.get('/api/db-status', async (req, res) => {
    if (!pool) return res.json({ connected: false, status: 'Not Configured (No DATABASE_URL)' });
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ connected: true, status: 'Connected', serverTime: result.rows[0].now });
    } catch (e) {
        res.json({ connected: false, status: 'Failed', error: e.message });
    }
});

// startBackgroundScraper();

process.on('uncaughtException', (err) => console.error('🚨 UNCAUGHT:', err.message));
process.on('unhandledRejection', (reason) => console.error('🚨 REJECTION:', reason));

app.listen(port, '0.0.0.0', () => console.log(`Server at http://0.0.0.0:${port}`));
