const { Client } = require('pg');
require('dotenv').config();
const client = new Client({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/horseracing' });

client.connect()
    .then(() => client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"))
    .then(res => {
        console.log("PostgreSQL Tables in 'public' schema:");
        if (res.rows.length === 0) {
            console.log("- (None found)");
        } else {
            res.rows.forEach(r => console.log('- ' + r.table_name));
        }
    })
    .catch(err => console.error('Database connection error:', err.message))
    .finally(() => client.end());
