const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function initSchema() {
    if (!process.env.DATABASE_URL) return;
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS races (
                id VARCHAR(100) PRIMARY KEY,
                name VARCHAR(255),
                url_oddschecker VARCHAR(500),
                url_racingpost VARCHAR(500),
                start_time TIMESTAMP,
                status VARCHAR(50) DEFAULT 'upcoming',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS horses (
                id SERIAL PRIMARY KEY,
                race_id VARCHAR(100) REFERENCES races(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                jockey VARCHAR(255),
                trainer VARCHAR(255),
                age INT,
                weight VARCHAR(50),
                official_rating INT,
                rpr INT,
                form VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(race_id, name)
            );

            CREATE TABLE IF NOT EXISTS odds_history (
                id SERIAL PRIMARY KEY,
                horse_id INT REFERENCES horses(id) ON DELETE CASCADE,
                decimal_odds DECIMAL(6,2),
                recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS ai_narrative (
                id SERIAL PRIMARY KEY,
                horse_id INT REFERENCES horses(id) ON DELETE CASCADE,
                reasoning_package JSONB,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(horse_id)
            );

            CREATE TABLE IF NOT EXISTS system_intent_vault (
                source_name VARCHAR(100) PRIMARY KEY,
                reliability_weight DECIMAL(5,2),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('🐘 Fully Relational PostgreSQL Schema Initialized');
    } catch (err) {
        console.error('❌ Schema creation failed:', err.message);
    }
}

async function saveRaceData(raceId, raceConfig, scrapedDataList) {
    if (!pool || !process.env.DATABASE_URL) return;
    const raceData = scrapedDataList[0];
    if (!raceData || !raceData.horses) return;

    try {
        // 1. Ensure Race exists
        await pool.query(
            `INSERT INTO races (id, name, url_oddschecker, url_racingpost, start_time) 
             VALUES ($1, $2, $3, $4, $5) 
             ON CONFLICT (id) DO NOTHING`,
            [raceId, raceConfig.name || raceId, raceConfig.oc, raceConfig.rp, raceConfig.startTime || null]
        );
    } catch (e) {
        console.error(`Error saving race ${raceId} to relational DB:`, e);
        return; // Can't proceed without race
    }

    const parseDbInt = (val) => {
        if (!val) return null;
        const parsed = parseInt(val);
        return isNaN(parsed) ? null : parsed;
    };

    // 2. Process Horses and Odds
    for (const horse of raceData.horses) {
        try {
            // Upsert horse to get ID
            const horseRes = await pool.query(
                `INSERT INTO horses (race_id, name, jockey, trainer, age, weight, official_rating, rpr, form) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
                 ON CONFLICT (race_id, name) DO UPDATE 
                 SET jockey = EXCLUDED.jockey, trainer = EXCLUDED.trainer, age = EXCLUDED.age, weight = EXCLUDED.weight, official_rating = EXCLUDED.official_rating, rpr = EXCLUDED.rpr, form = EXCLUDED.form
                 RETURNING id`,
                [raceId, horse.name, horse.jockey, horse.trainer, parseDbInt(horse.age), horse.weight, parseDbInt(horse.officialRating), parseDbInt(horse.rpr), horse.form]
            );

            const horseId = horseRes.rows[0].id;

            // Get Best Odds
            let bestDecimal = 0;
            if (horse.odds && typeof horse.odds === 'object' && Object.keys(horse.odds).length > 0) {
                Object.values(horse.odds).forEach(o => {
                    if (o && o.decimal > bestDecimal) bestDecimal = o.decimal;
                });
            } else if (horse.openingOdds) {
                bestDecimal = parseFloat(horse.openingOdds);
            }

            // Record Odds if > 0
            if (bestDecimal > 0) {
                // To avoid spamming exact same odds continually, check latest
                const lastOddsRes = await pool.query(`SELECT decimal_odds FROM odds_history WHERE horse_id = $1 ORDER BY recorded_at DESC LIMIT 1`, [horseId]);
                const lastOdds = lastOddsRes.rows.length > 0 ? parseFloat(lastOddsRes.rows[0].decimal_odds) : 0;

                if (lastOdds !== bestDecimal) {
                    await pool.query(
                        `INSERT INTO odds_history (horse_id, decimal_odds) VALUES ($1, $2)`,
                        [horseId, bestDecimal]
                    );
                }
            }

            // Reattach horse_id to the object for reference
            horse.db_id = horseId;

            // Save Narrative if exists
            if (horse.aiReasoning) {
                await saveNarrative(horseId, horse.aiReasoning);
            }
        } catch (he) {
            console.error(`Error saving horse ${horse.name} in race ${raceId}:`, he.message);
            // Continue to the next horse instead of aborting the whole race!
        }
    }
}

async function saveNarrative(horseId, reasoningPackage) {
    if (!pool || !process.env.DATABASE_URL || !horseId) return;
    try {
        await pool.query(
            `INSERT INTO ai_narrative (horse_id, reasoning_package, updated_at) 
             VALUES ($1, $2, NOW()) 
             ON CONFLICT (horse_id) DO UPDATE SET reasoning_package = EXCLUDED.reasoning_package, updated_at = NOW()`,
            [horseId, JSON.stringify(reasoningPackage)]
        );
    } catch (e) {
        console.error('Save narrative error:', e.message);
    }
}

async function getRaceData(raceId) {
    if (!pool || !process.env.DATABASE_URL) return null;

    // Stitch it back together
    try {
        const raceRes = await pool.query('SELECT * FROM races WHERE id = $1', [raceId]);
        if (raceRes.rows.length === 0) return null;

        const horsesRes = await pool.query('SELECT * FROM horses WHERE race_id = $1', [raceId]);

        let constructedHorses = [];

        for (const hRow of horsesRes.rows) {
            const hId = hRow.id;

            // Get odds points to reconstruct opening vs current and velocity
            // This replicates the old logic perfectly
            const oddsRes = await pool.query('SELECT decimal_odds, recorded_at FROM odds_history WHERE horse_id = $1 ORDER BY recorded_at ASC', [hId]);

            let marketMove = 'stable';
            let openingOdds = 0;
            let currentOdds = 0;
            let movePercent = 0;
            let velocity = 0;

            if (oddsRes.rows.length > 0) {
                openingOdds = parseFloat(oddsRes.rows[0].decimal_odds);
                currentOdds = parseFloat(oddsRes.rows[oddsRes.rows.length - 1].decimal_odds);

                if (currentOdds < openingOdds && currentOdds > 0) {
                    marketMove = 'steamer';
                    movePercent = Math.round(((openingOdds - currentOdds) / openingOdds) * 100);
                } else if (currentOdds > openingOdds && openingOdds > 0) {
                    marketMove = 'drifter';
                    movePercent = Math.round(((currentOdds - openingOdds) / openingOdds) * 100);
                }

                // Velocity calc (last 30 mins)
                if (oddsRes.rows.length >= 2) {
                    const latest = oddsRes.rows[oddsRes.rows.length - 1];
                    const prev = oddsRes.rows[oddsRes.rows.length - 2];
                    const timeDiff = (new Date(latest.recorded_at) - new Date(prev.recorded_at)) / 60000;
                    if (timeDiff > 0 && timeDiff < 60) {
                        velocity = (currentOdds - parseFloat(prev.decimal_odds)) / timeDiff;
                    }
                }
            }

            const narrativeRes = await pool.query('SELECT reasoning_package FROM ai_narrative WHERE horse_id = $1', [hId]);
            const aiReasoning = narrativeRes.rows.length > 0 ? narrativeRes.rows[0].reasoning_package : null;

            // Frontend expects an object with multiple bookmakers to calculate 'averageOdds'
            // and uses 'fraction' internally to calculate and render the visual grid.
            let mockOddsDist = {};
            if (currentOdds > 0) {
                mockOddsDist = {
                    'best': { decimal: currentOdds, fraction: currentOdds.toFixed(2) },
                    'bk1': { decimal: currentOdds, fraction: currentOdds.toFixed(2) },
                    'bk2': { decimal: currentOdds, fraction: currentOdds.toFixed(2) } // Provide enough data for the frontend to average it
                };
            }

            constructedHorses.push({
                db_id: hId,
                name: hRow.name,
                jockey: hRow.jockey || '',
                trainer: hRow.trainer || '',
                age: hRow.age ? hRow.age.toString() : '',
                weight: hRow.weight || '',
                officialRating: hRow.official_rating ? hRow.official_rating.toString() : '',
                rpr: hRow.rpr ? hRow.rpr.toString() : '',
                form: hRow.form || '',
                odds: mockOddsDist,
                marketMove,
                openingOdds,
                movePercent,
                velocity,
                aiReasoning
            });
        }

        return [{
            name: raceRes.rows[0].name,
            horses: constructedHorses
        }];

    } catch (e) {
        console.error('getRaceData error:', e.message);
        return null;
    }
}

async function getNarrative(horseId) {
    if (!pool || !process.env.DATABASE_URL) return null;
    try {
        const res = await pool.query('SELECT reasoning_package FROM ai_narrative WHERE horse_id = $1', [horseId]);
        return res.rows.length > 0 ? res.rows[0].reasoning_package : null;
    } catch (e) {
        return null;
    }
}

async function getIntentVault() {
    if (!pool || !process.env.DATABASE_URL) return null;
    try {
        const res = await pool.query('SELECT * FROM system_intent_vault');
        const vault = { sourceReliability: {} };
        for (const row of res.rows) {
            vault.sourceReliability[row.source_name] = { weight: parseFloat(row.reliability_weight) };
        }
        return Object.keys(vault.sourceReliability).length > 0 ? vault : null;
    } catch (e) {
        return null;
    }
}

async function saveIntentVault(vault) {
    if (!pool || !process.env.DATABASE_URL) return;
    try {
        for (const source in vault.sourceReliability) {
            await pool.query(
                `INSERT INTO system_intent_vault (source_name, reliability_weight, updated_at) 
                 VALUES ($1, $2, NOW()) 
                 ON CONFLICT (source_name) DO UPDATE SET reliability_weight = EXCLUDED.reliability_weight, updated_at = NOW()`,
                [source, vault.sourceReliability[source].weight]
            );
        }
    } catch (e) {
        console.error('saveIntent error:', e.message);
    }
}

module.exports = {
    pool,
    initSchema,
    saveRaceData,
    getRaceData,
    saveNarrative,
    getNarrative,
    getIntentVault,
    saveIntentVault
};
