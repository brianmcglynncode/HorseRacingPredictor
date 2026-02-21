const fs = require('fs');
const path = require('path');
const narrativeEngine = require('./narrativeEngine');

const HISTORY_FILE = path.join(__dirname, 'history.json');

try {
    if (fs.existsSync(HISTORY_FILE)) {
        const historyData = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));

        console.log("Populating Deep Reasoning for all races...");

        for (const raceId in historyData.races) {
            const race = historyData.races[raceId];
            if (race.latestData && race.latestData[0] && race.latestData[0].horses) {
                const raceData = race.latestData[0];
                console.log(`Processing ${raceId}...`);

                raceData.horses.forEach(horse => {
                    const reasoning = narrativeEngine.generateReasoning(horse, raceData, raceData.horses);
                    horse.aiReasoning = reasoning;
                });
            }
        }

        fs.writeFileSync(HISTORY_FILE, JSON.stringify(historyData, null, 2));
        console.log("✅ history.json updated with AI Reasoning.");
    } else {
        console.log("❌ history.json not found.");
    }
} catch (err) {
    console.error("Error populating reasoning:", err);
}
