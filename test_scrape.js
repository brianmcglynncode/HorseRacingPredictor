const { scrapeCheltenhamFestival } = require('./scraper');

async function test() {
    console.log("Testing scraper for Supreme Novices' Hurdle...");
    try {
        const data = await scrapeCheltenhamFestival(
            'https://www.oddschecker.com/cheltenham-festival/supreme-novices-hurdle/winner',
            'https://www.racingpost.com/cheltenham-festival/supreme-novices-hurdle/'
        );
        console.log("Scrape result:", JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Test failed:", error);
    }
}

test();
