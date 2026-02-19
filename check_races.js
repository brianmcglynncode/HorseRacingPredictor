const axios = require('axios');
const cheerio = require('cheerio');

const RACES = {
    // --- WEDNESDAY ---
    'ballymore': 'https://www.oddschecker.com/cheltenham-festival/gallagher-novices-hurdle/winner',
    'brown': 'https://www.oddschecker.com/cheltenham-festival/brown-advisory-novices-chase/winner',
    'coral': 'https://www.oddschecker.com/cheltenham-festival/coral-cup/winner',
    'championchase': 'https://www.oddschecker.com/cheltenham-festival/queen-mother-champion-chase/winner',
    'cross': 'https://www.oddschecker.com/cheltenham-festival/cross-country-chase/winner',
    'grandannual': 'https://www.oddschecker.com/cheltenham-festival/grand-annual-chase/winner',
    'bumper': 'https://www.oddschecker.com/cheltenham-festival/champion-bumper/winner',

    // --- THURSDAY ---
    'turners': 'https://www.oddschecker.com/cheltenham-festival/turners-novices-chase/winner',
    'pertemps': 'https://www.oddschecker.com/cheltenham-festival/pertemps-network-final/winner',
    'ryanair': 'https://www.oddschecker.com/cheltenham-festival/ryanair-chase/winner',
    'stayers': 'https://www.oddschecker.com/cheltenham-festival/stayers-hurdle/winner',
    'plate': 'https://www.oddschecker.com/cheltenham-festival/festival-plate/winner',
    'maresnovice': 'https://www.oddschecker.com/cheltenham-festival/mares-novices-hurdle/winner',
    'kimmuir': 'https://www.oddschecker.com/cheltenham-festival/kim-muir-challenge-cup/winner',

    // --- FRIDAY ---
    'triumph': 'https://www.oddschecker.com/cheltenham-festival/triumph-hurdle/winner',
    'county': 'https://www.oddschecker.com/cheltenham-festival/county-hurdle/winner',
    'bartlett': 'https://www.oddschecker.com/cheltenham-festival/albert-bartlett-novices-hurdle/winner',
    'goldcup': 'https://www.oddschecker.com/cheltenham-festival/cheltenham-gold-cup/winner',
    'hunters': 'https://www.oddschecker.com/cheltenham-festival/foxhunter-chase/winner',
    'mareschase': 'https://www.oddschecker.com/cheltenham-festival/mares-chase/winner',
    'martinpipe': 'https://www.oddschecker.com/cheltenham-festival/martin-pipe-handicap-hurdle/winner'
};

async function checkUrl(id, url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        // Simple check: does it look like an OddsChecker market page?
        // It usually has "Odds" or specific class names.
        // We'll just check status 200 for now.
        console.log(`[PASS] ${id}: ${response.status}`);

        // Optional: Check if redirected
        if (response.request.res.responseUrl !== url) {
            console.log(`[WARN] ${id} redirected to: ${response.request.res.responseUrl}`);
        }

    } catch (error) {
        console.error(`[FAIL] ${id}: ${error.message} (${url})`);
    }
}

async function runTests() {
    console.log("Checking Race URLs...");
    for (const [id, url] of Object.entries(RACES)) {
        await checkUrl(id, url);
        // small delay to be polite
        await new Promise(r => setTimeout(r, 500));
    }
}

runTests();
