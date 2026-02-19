const { scrapeCheltenhamFestival } = require('./scraper');

(async () => {
    // New URL with handicap
    const ocUrl = 'https://www.oddschecker.com/cheltenham-festival/national-hunt-novices-handicap-chase/winner';
    const rpUrl = 'https://www.racingpost.com/cheltenham-festival/national-hunt-chase/';

    console.log(`Testing National Hunt URL: ${ocUrl}`);
    const data = await scrapeCheltenhamFestival(ocUrl, rpUrl);

    if (data && data[0] && data[0].horses.length > 0) {
        console.log("SUCCESS! Found horses:", data[0].horses.length);
        console.log("Race Name:", data[0].name);
    } else {
        console.log("FAILED.");
        if (data && data[0]) console.log("Race Name:", data[0].name);
    }
})();
