const { scrapeCheltenhamFestival } = require('./scraper');

async function test() {
    console.log("Testing scraper for Supreme Novices' Hurdle...");
    try {
        const data = await scrapeCheltenhamFestival(
            'https://www.oddschecker.com/cheltenham-festival/supreme-novices-hurdle/winner',
            'https://www.racingpost.com/cheltenham-festival/supreme-novices-hurdle/'
        );
        console.log("Scrape result count:", data[0].horses.length);
        // Log first 3 horses to check for new fields
        console.log("Sample Data:", JSON.stringify(data[0].horses.slice(0, 3), null, 2));
    } catch (error) {
        console.error("Test failed:", error);
    }
}

test();
