require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function createSchema() {
    console.log('🚀 Building Relational Schema on Railway PostgreSQL...');
    try {
        await pool.query(`
            -- 1. Create Races Table
            CREATE TABLE IF NOT EXISTS races (
                id VARCHAR(100) PRIMARY KEY,
                name VARCHAR(255),
                url_oddschecker VARCHAR(500),
                url_racingpost VARCHAR(500),
                start_time TIMESTAMP,
                status VARCHAR(50) DEFAULT 'upcoming',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- 2. Create Horses Table
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

            -- 3. Create Odds History Table (Velocity Engine)
            CREATE TABLE IF NOT EXISTS odds_history (
                id SERIAL PRIMARY KEY,
                horse_id INT REFERENCES horses(id) ON DELETE CASCADE,
                decimal_odds DECIMAL(6,2),
                recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- 4. Create AI Narrative Table (Replaces deep_reasoning_history.json)
            CREATE TABLE IF NOT EXISTS ai_narrative (
                id SERIAL PRIMARY KEY,
                horse_id INT REFERENCES horses(id) ON DELETE CASCADE,
                reasoning_package JSONB,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(horse_id)
            );

            -- 5. Create System Intent Vault Table (Replaces intent_vault.json)
            CREATE TABLE IF NOT EXISTS system_intent_vault (
                source_name VARCHAR(100) PRIMARY KEY,
                reliability_weight DECIMAL(5,2),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ PostgreSQL Schema Built Successfully!');
    } catch (err) {
        console.error('❌ Schema creation failed:', err.message);
    } finally {
        pool.end();
    }
}

createSchema();
