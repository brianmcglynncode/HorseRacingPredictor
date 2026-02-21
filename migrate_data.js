require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const HISTORY_FILE = path.join(__dirname, 'history.json');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrateData() {
    console.log('🚀 Starting Data Migration to PostgreSQL...');
    try {
        if (!fs.existsSync(HISTORY_FILE)) {
            console.log('❌ history.json not found! Nothing to migrate.');
            process.exit(0);
        }

        const rawData = fs.readFileSync(HISTORY_FILE, 'utf8');
        const historyJson = JSON.parse(rawData);

        if (!historyJson.races || Object.keys(historyJson.races).length === 0) {
            console.log('⚠️ history.json is empty or has no races.');
            process.exit(0);
        }

        const raceIds = Object.keys(historyJson.races);
        console.log(`📦 Found ${raceIds.length} races in local history.json.`);

        let successCount = 0;
        let errorCount = 0;

        for (const rId of raceIds) {
            const data = historyJson.races[rId];
            try {
                await pool.query(
                    `INSERT INTO race_history (id, data, updated_at) VALUES ($1, $2, NOW())
                     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
                    [rId, data]
                );
                successCount++;
                console.log(`✅ Migrated race: ${rId}`);
            } catch (err) {
                errorCount++;
                console.error(`❌ Failed to migrate race ${rId}:`, err);
            }
        }

        console.log('\n--- Migration Summary ---');
        console.log(`Successfully migrated: ${successCount}`);
        console.log(`Failed to migrate: ${errorCount}`);

    } catch (err) {
        console.error('❌ Migration crashed:', err);
    } finally {
        pool.end();
    }
}

migrateData();
