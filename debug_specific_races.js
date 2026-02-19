const { scrapeCheltenhamFestival } = require('./scraper');

const RACES = {
    'arkle': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/arkle-chase/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/arkle-novices-chase/'
    },
    'ultima': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/ultima-handicap-chase/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/ultima-handicap-chase/'
    },
    'boodles': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/hallgarten-and-novum-wines-juvenile-handicap-hurdle/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/boodles-juvenile-handicap-hurdle/'
    },
    'national': {
        oc: 'https://www.oddschecker.com/cheltenham-festival/national-hunt-novices-chase/winner',
        rp: 'https://www.racingpost.com/cheltenham-festival/national-hunt-chase/'
    }
};

(async () => {
    // Test Arkle
    console.log("----------------------------------------------------------------");
    console.log("DEBUGGING ARKLE");
    console.log("----------------------------------------------------------------");
    try {
        const arkleData = await scrapeCheltenhamFestival(RACES.arkle.oc, RACES.arkle.rp);
        console.log("Arkle Data Found:", arkleData && arkleData.length > 0 ? "YES" : "NO");
        if (arkleData && arkleData[0]) {
            console.log(`Race Name: ${arkleData[0].name}`);
            console.log(`Horses Found: ${arkleData[0].horses ? arkleData[0].horses.length : 0}`);
        }
    } catch (e) {
        console.error("Arkle Scrape Failed:", e);
    }

    // Test Ultima
    console.log("\n----------------------------------------------------------------");
    console.log("DEBUGGING ULTIMA");
    console.log("----------------------------------------------------------------");
    try {
        const ultimaData = await scrapeCheltenhamFestival(RACES.ultima.oc, RACES.ultima.rp);
        console.log("Ultima Data Found:", ultimaData && ultimaData.length > 0 ? "YES" : "NO");
        if (ultimaData && ultimaData[0]) {
            console.log(`Race Name: ${ultimaData[0].name}`);
            console.log(`Horses Found: ${ultimaData[0].horses ? ultimaData[0].horses.length : 0}`);
        }
    } catch (e) {
        console.error("Ultima Scrape Failed:", e);
    }


    // Test Boodles
    console.log("\n----------------------------------------------------------------");
    console.log("DEBUGGING BOODLES");
    console.log("----------------------------------------------------------------");
    try {
        const boodlesData = await scrapeCheltenhamFestival(RACES.boodles.oc, RACES.boodles.rp);
        console.log("Boodles Data Found:", boodlesData && boodlesData.length > 0 ? "YES" : "NO");
        if (boodlesData && boodlesData[0]) {
            console.log(`Race Name: ${boodlesData[0].name}`);
            console.log(`Horses Found: ${boodlesData[0].horses ? boodlesData[0].horses.length : 0}`);
        }
    } catch (e) {
        console.error("Boodles Scrape Failed:", e);
    }

    // Test National Hunt
    console.log("\n----------------------------------------------------------------");
    console.log("DEBUGGING NATIONAL HUNT");
    console.log("----------------------------------------------------------------");
    try {
        const nationalData = await scrapeCheltenhamFestival(RACES.national.oc, RACES.national.rp);
        console.log("National Hunt Data Found:", nationalData && nationalData.length > 0 ? "YES" : "NO");
        if (nationalData && nationalData[0]) {
            console.log(`Race Name: ${nationalData[0].name}`);
            console.log(`Horses Found: ${nationalData[0].horses ? nationalData[0].horses.length : 0}`);
        }
    } catch (e) {
        console.error("National Hunt Scrape Failed:", e);
    }

})();
