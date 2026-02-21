const fs = require('fs');
const path = require('path');
const discovery = require('./discovery');

/**
 * Stable Whisper Backtester
 * Use this to feed results back into the AI.
 * Example: node backtest_whispers.js 'Old Park Star' winner
 */

const horseName = process.argv[2];
const result = process.argv[3]; // 'winner' or 'lost'

if (!horseName || !result) {
    console.log("Usage: node backtest_whispers.js 'Horse Name' winner/lost");
    process.exit(0);
}

async function backtest() {
    console.log(`🧠 BACKTESTING: Analyzing whisper accuracy for ${horseName}...`);

    // 1. Get the intelligence profile for this horse
    const intel = await discovery.getHorseIntelligence(horseName);
    const sources = intel.proStories.map(s => s.source);

    if (sources.length === 0) {
        console.log("❌ No professional whispers found for this horse in the vault.");
        return;
    }

    // 2. Load Intent Vault
    const vaultPath = path.join(__dirname, 'intent_vault.json');
    const vault = JSON.parse(fs.readFileSync(vaultPath, 'utf8'));

    // 3. Update Reliability
    sources.forEach(source => {
        if (!vault.sourceReliability[source]) {
            vault.sourceReliability[source] = { mentions: 0, wins: 0, weight: 1.0 };
        }

        const stats = vault.sourceReliability[source];
        stats.mentions++;

        if (result === 'winner') {
            stats.wins++;
            // Reward the source: Increase weight by 0.05 (Max 2.0)
            stats.weight = Math.min(2.0, stats.weight + 0.05);
            console.log(`✅ ${source} was RIGHT. Weight increased to ${stats.weight.toFixed(2)}`);
        } else {
            // Penalize the source: Decrease weight by 0.02 (Min 0.5)
            stats.weight = Math.max(0.5, stats.weight - 0.02);
            console.log(`❌ ${source} was WRONG. Weight decreased to ${stats.weight.toFixed(2)}`);
        }
    });

    // 4. Log the event
    vault.whisperLog.unshift({
        horse: horseName,
        result: result,
        sources: sources,
        timestamp: new Date().toISOString()
    });

    fs.writeFileSync(vaultPath, JSON.stringify(vault, null, 2));
    console.log("💾 Intent Vault updated. The AI will be smarter in the next cycle.");
}

backtest();
