const { scrapeCheltenhamFestival } = require('./scraper');

(async () => {
    console.log("Starting Debug Scrape...");
    const data = await scrapeCheltenhamFestival();

    if (data && data.length > 0) {
        const race = data[0]; // Assuming 1 race
        console.log(`\n--- Scrape Result ---`);
        console.log(`Race Name: ${race.name}`);
        console.log(`Total Horses: ${race.horses.length}`);

        const horsesWithExpertData = race.horses.filter(h => h.rpr || h.form || h.trainer);
        console.log(`Horses with Expert Data: ${horsesWithExpertData.length}`);

        if (horsesWithExpertData.length === 0) {
            console.log("\nWARNING: No expert data merged!");
            console.log("Sample OC Name:", race.horses[0].name);
        } else {
            console.log("\nSample Merged Horse:", horsesWithExpertData[0]);
        }
    } else {
        console.error("No data returned from scraper.");
    }
})();
