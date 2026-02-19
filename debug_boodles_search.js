const { scrapeCheltenhamFestival } = require('./scraper');

(async () => {
    const urls = [
        'https://www.oddschecker.com/cheltenham-festival/hallgarten-and-novum-wines-juvenile-handicap-hurdle/winner',
        'https://www.oddschecker.com/cheltenham-festival/fred-winter-juvenile-handicap-hurdle/winner',
        'https://www.oddschecker.com/cheltenham-festival/fred-winter-juvenile-novices-handicap-hurdle/winner'
    ];

    for (const url of urls) {
        console.log(`\nTesting URL: ${url}`);
        const data = await scrapeCheltenhamFestival(url, 'https://www.racingpost.com/cheltenham-festival/boodles-juvenile-handicap-hurdle/'); // Keep RP constant as it works
        if (data && data.length > 0 && data[0].horses.length > 0) {
            console.log("SUCCESS! Found horses:", data[0].horses.length);
            console.log("Race Name:", data[0].name);
            break; // Found a working one
        } else {
            console.log("FAILED. Horses found:", data && data[0] ? data[0].horses.length : 0);
            if (data && data[0]) console.log("Race Name (likely homepage if 'oddschecker'):", data[0].name);
        }
    }
})();
