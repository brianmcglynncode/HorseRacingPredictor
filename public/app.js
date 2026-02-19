document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader');
    const racesGrid = document.getElementById('races-grid');
    const loaderText = document.getElementById('loader-text');
    const raceNav = document.querySelector('.race-nav');
    const dayButtons = document.querySelectorAll('.day-btn');

    // Day -> Races Schedule
    const schedule = {
        'Tuesday': [
            { id: 'supreme', time: '13:30', name: 'Supreme' },
            { id: 'arkle', time: '14:10', name: 'Arkle' },
            { id: 'ultima', time: '14:50', name: 'Ultima' },
            { id: 'champion', time: '15:30', name: 'Champion' },
            { id: 'mares', time: '16:10', name: 'Mares' },
            { id: 'boodles', time: '16:50', name: 'Boodles' },
            { id: 'national', time: '17:30', name: 'National Hunt' }
        ],
        'Wednesday': [
            { id: 'ballymore', time: '13:30', name: 'Ballymore' },
            { id: 'brown', time: '14:10', name: 'Brown Adv' },
            { id: 'coral', time: '14:50', name: 'Coral Cup' },
            { id: 'championchase', time: '15:30', name: 'Champ Chase' },
            { id: 'cross', time: '16:10', name: 'Cross Ctry' },
            { id: 'grandannual', time: '16:50', name: 'Grand Annual' },
            { id: 'bumper', time: '17:30', name: 'Bumper' }
        ],
        'Thursday': [
            { id: 'turners', time: '13:30', name: 'Turners' },
            { id: 'pertemps', time: '14:10', name: 'Pertemps' },
            { id: 'ryanair', time: '14:50', name: 'Ryanair' },
            { id: 'stayers', time: '15:30', name: 'Stayers' },
            { id: 'plate', time: '16:10', name: 'Plate' },
            { id: 'maresnovice', time: '16:50', name: 'Mares Nov' },
            { id: 'kimmuir', time: '17:30', name: 'Kim Muir' }
        ],
        'Friday': [
            { id: 'triumph', time: '13:30', name: 'Triumph' },
            { id: 'county', time: '14:10', name: 'County' },
            { id: 'bartlett', time: '14:50', name: 'Bartlett' },
            { id: 'goldcup', time: '15:30', name: 'Gold Cup' },
            { id: 'hunters', time: '16:10', name: 'Hunters' },
            { id: 'mareschase', time: '16:50', name: 'Mares Chs' },
            { id: 'martinpipe', time: '17:30', name: 'Martin Pipe' }
        ]
    };

    function renderRaceButtons(day) {
        raceNav.innerHTML = ''; // Clear existing
        const races = schedule[day] || [];

        races.forEach(race => {
            const btn = document.createElement('button');
            btn.className = 'race-btn';
            btn.setAttribute('data-race', race.id);
            btn.innerHTML = `
                <span class="race-time">${race.time}</span>
                <span class="race-name">${race.name}</span>
            `;

            // Attach click listener immediately
            btn.addEventListener('click', () => handleRaceClick(btn));

            raceNav.appendChild(btn);
        });

        // Reset to empty state view when changing days
        resetView();
    }

    function resetView() {
        racesGrid.classList.remove('hidden');
        racesGrid.innerHTML = `
            <div class="empty-action">
                <span class="pulse-icon">👆</span> Please select a race above
            </div>
            <div class="fun-message">
                Saddle up! <span class="bounce">🐎</span><span class="bounce" style="animation-delay: 0.1s">🍀</span>
            </div>
        `;
    }

    // Day Button Logic
    dayButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            dayButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Render races for this day
            const selectedDay = btn.textContent.trim();
            renderRaceButtons(selectedDay);
        });
    });

    // Initialize with Tuesday
    renderRaceButtons('Tuesday');


    async function handleRaceClick(btn) {
        const raceId = btn.getAttribute('data-race');
        const raceName = btn.querySelector('.race-name').textContent;

        // Update Active State
        const allRaceBtns = document.querySelectorAll('.race-btn');
        allRaceBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // UI State
        allRaceBtns.forEach(b => b.disabled = true); // Prevent multiple clicks
        loader.classList.remove('hidden');
        racesGrid.classList.add('hidden');
        // Cinematic Loading Sequence
        const loadingMessages = [
            `📡 Connecting to Oddsmakers...`,
            `🧠 Analyzing ${raceName} Market Structure...`,
            `🤖 Running Outlier Hunter Algorithm...`,
            `📊 Calculating Weighted Consensus...`,
            `🐎 Evaluating Expert Form Data...`,
            `⚡ Identifying Steamers & Drifters...`,
            `✅ Finalizing Predictions...`
        ];

        let msgIndex = 0;
        loaderText.textContent = loadingMessages[0];

        // Cycle messages to show "hard work"
        const intervalId = setInterval(() => {
            msgIndex = (msgIndex + 1) % loadingMessages.length;
            loaderText.textContent = loadingMessages[msgIndex];
        }, 700);

        try {
            const startTime = Date.now();
            const response = await fetch(`/api/scrape?raceId=${raceId}`);
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }

            const result = await response.json();

            // Artificial delay for "Cinematic Analysis" feel (requested by user)
            // Even if cached, we make it look like we're crunching numbers
            const elapsed = Date.now() - startTime;
            const minDelay = 3500; // Increased to 3.5s to let the user see the cool messages
            if (elapsed < minDelay) {
                await new Promise(r => setTimeout(r, minDelay - elapsed));
            }

            if (result.success && result.data.length > 0) {
                console.log("Received Data:", result.data);
                renderRaces(result.data, result.lastUpdated);
            } else {
                racesGrid.innerHTML = `
                        <div class="empty-state">
                            <p style="color: #ff4b2b;">No races found or scraper was blocked.</p>
                            <p style="font-size: 0.9rem;">Try again later or check console/server logs.</p>
                        </div>
                    `;
            }

        } catch (error) {
            console.error('Fetch error:', error);
            racesGrid.innerHTML = `
                    <div class="empty-state">
                        <p style="color: #ff4b2b;">Error fetching data: ${error.message}</p>
                    </div>
                `;
        } finally {
            clearInterval(intervalId); // Stop the text cycling
            loader.classList.add('hidden');
            racesGrid.classList.remove('hidden');
            allRaceBtns.forEach(b => b.disabled = false);
        }
    }

    // Helper to convert fraction to decimal
    function fractionToDecimal(fraction) {
        if (!fraction) return 0;
        if (!fraction.includes('/')) return parseFloat(fraction);
        const [num, den] = fraction.split('/').map(Number);
        return (num / den) + 1;
    }

    // Bookmaker Weights (Sharp vs Soft)
    const bookieWeights = {
        'Betfair': 2.0, 'Matchbook': 2.0, 'Pinnacle': 2.0, 'Smarkets': 2.0, // Exchanges/Sharps
        'bet365': 1.5, 'William Hill': 1.5, 'Unibet': 1.5, 'BetVictor': 1.5, // Solid/Early
        'Paddy Power': 1.0, 'Skybet': 1.0, 'Ladbrokes': 1.0, 'Coral': 1.0, 'Boylesports': 1.0 // Soft/Recreational
    };

    function getBookieWeight(name) {
        // Default to 1.0 if unknown, partial match check could be added if needed
        return bookieWeights[name] || 1.0;
    }

    function renderRaces(races, lastUpdated) {
        racesGrid.innerHTML = '';

        // Format Last Updated
        let timeAgo = 'Just now';
        if (lastUpdated) {
            const diff = Math.floor((new Date() - new Date(lastUpdated)) / 60000); // minutes
            timeAgo = diff < 1 ? 'Just now' : `${diff}m ago`;
        }

        races.forEach((race, index) => {
            const container = document.createElement('div');
            container.className = 'race-container';

            // Extract all unique bookmakers from this race to build header
            const bookmakers = race.bookmakers || [];

            // Pre-process horses to calculate stats and sort
            race.horses.forEach(horse => {
                // Weighted Model Variables
                let weightedProbSum = 0;
                let totalWeight = 0;
                let totalDecimal = 0;
                let validQuotes = 0;

                // Calculate Standard Deviation for Disagreement Signal
                // Implied Probabilities for this horse
                const probabilities = [];
                bookmakers.forEach(bk => {
                    const odds = horse.odds[bk];
                    if (odds && odds.fraction) {
                        const dec = fractionToDecimal(odds.fraction);
                        if (dec > 0) {
                            const prob = (1 / dec) * 100;
                            probabilities.push(prob);

                            // Weighting Logic
                            const weight = getBookieWeight(bk);
                            weightedProbSum += prob * weight;
                            totalWeight += weight;

                            totalDecimal += dec;
                            validQuotes++;
                        }
                    }
                });

                horse.averageOdds = validQuotes > 0 ? totalDecimal / validQuotes : 999;

                // Use Weighted Probability for Consensus if weights exist, else standard
                horse.impliedProb = totalWeight > 0 ? weightedProbSum / totalWeight : 0;

                // Standard Deviation Calculation
                if (probabilities.length > 1) {
                    const mean = probabilities.reduce((a, b) => a + b, 0) / probabilities.length;
                    const variance = probabilities.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / probabilities.length;
                    horse.stdDev = Math.sqrt(variance);
                } else {
                    horse.stdDev = 0;
                }

                // Disagreement Signal Logic
                // High disagreement if SD > 2.5% AND Mean Probability > 15% (relevant horses only)
                horse.disagreement = (horse.stdDev > 2.5 && horse.impliedProb > 15);

                // --- MY PICK Composite Score Calculation ---
                // 1. Consensus Score (0-40 pts): Normalized Implied Prob
                const consensusScore = Math.min(horse.impliedProb, 100) * 0.4;

                // 2. Value Score (0 or 20 pts): Bonus for value bet
                let valueScore = 0;
                bookmakers.forEach(bk => {
                    const odds = horse.odds[bk];
                    if (odds && odds.fraction) {
                        const d = fractionToDecimal(odds.fraction);
                        if (d > horse.averageOdds * 1.2) valueScore = 20; // 20 pts for value
                    }
                });

                // 3. Expert Score (0-30 pts): RPR
                let expertScore = 0;
                const rpr = parseInt(horse.rpr) || 0;
                if (rpr > 130) {
                    expertScore = Math.min(rpr - 130, 30); // Max 30 pts (reached at RPR 160)
                }

                // 4. Form Momentum Score (0-20 pts)
                let formScore = 0;
                horse.isHot = false;
                horse.isCold = false;

                if (horse.form) {
                    const cleanForm = horse.form.replace(/[^0-9PFU]/g, ''); // Keep numbers and P/F/U
                    const last3 = cleanForm.slice(-3);
                    const lastChar = cleanForm.slice(-1);

                    // Win Bonuses
                    if (lastChar === '1') formScore += 10;
                    if (last3.endsWith('11')) { formScore += 10; horse.isHot = true; } // Winning streak
                    if (last3.endsWith('111')) formScore += 5; // Hat-trick bonus

                    // Place Bonuses
                    if (['2', '3'].includes(lastChar)) formScore += 5;

                    // Risk Penalties
                    if (['P', 'F', 'U'].includes(lastChar)) { formScore -= 15; horse.isCold = true; } // Bad last run
                    if (cleanForm.includes('00')) formScore -= 10; // Poor form sequence
                }

                // 5. Age Trends (Supreme Novices favors 5-6yo)
                let ageScore = 0;
                if (horse.age) {
                    const ageVal = parseInt(horse.age);
                    if (ageVal === 5 || ageVal === 6) ageScore = 10; // "Golden Age"
                    else if (ageVal > 7) ageScore = -5; // Penalty for older horses in Novice hurdle
                }

                // 6. Official Rating Bonus
                let orScore = 0;
                if (horse.officialRating && horse.officialRating !== '-') {
                    const orVal = parseInt(horse.officialRating);
                    if (orVal > 145) orScore = 10; // Proven quality
                }

                // 7. Weight Advantage
                // Standard is 11-7. If less, it's an allowance (good).
                let weightScore = 0;
                if (horse.weight) {
                    const [st, lb] = horse.weight.split('-').map(Number);
                    if (st < 11 || (st === 11 && lb < 7)) {
                        weightScore = 15; // Significant weight advantage
                    }
                }

                // 8. Elite Trainer Bonus
                // Willie Mullins, Gordon Elliott, Nicky Henderson, Henry de Bromhead, Paul Nicholls
                let trainerScore = 0;
                const eliteTrainers = ['mullins', 'elliott', 'henderson', 'bromhead', 'nicholls', 'skelton'];
                if (horse.trainer) {
                    const t = horse.trainer.toLowerCase();
                    if (eliteTrainers.some(et => t.includes(et))) {
                        trainerScore = 15; // Significant boost for top yards
                        horse.isEliteTrainer = true;
                    }
                }

                horse.compositeScore = consensusScore + valueScore + expertScore + formScore + ageScore + orScore + trainerScore + weightScore;
            });

            // Sort by Market Consensus (Implied Probability DESC / Average Odds ASC)
            race.horses.sort((a, b) => b.impliedProb - a.impliedProb);

            // Find Top Pick (Highest Composite Score)
            const myPick = [...race.horses].sort((a, b) => b.compositeScore - a.compositeScore)[0];

            // Find Each Way Picks (Odds >= 6.0 (5/1) and high Composite Score, excluding Top Pick)
            const eachWayCandidates = race.horses.filter(h =>
                h.name !== myPick.name &&
                h.averageOdds >= 6.0
            ).sort((a, b) => b.compositeScore - a.compositeScore);

            const eachWayPicks = eachWayCandidates.slice(0, 2);

            let myPickHtml = '';
            if (myPick) {
                let eachWayHtml = '';
                if (eachWayPicks.length > 0) {
                    eachWayHtml = `
                        <div class="ew-section">
                            <h4 class="ew-title">🎯 Each Way Value Picks</h4>
                            <div class="ew-grid">
                                ${eachWayPicks.map(ew => `
                                    <div class="ew-card">
                                        <div class="ew-name">${ew.name}</div>
                                        <div class="ew-details">
                                            <span class="ew-odds">${ew.averageOdds.toFixed(2)}</span>
                                            <span class="ew-score">Score: ${ew.compositeScore.toFixed(0)}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                }

                myPickHtml = `
                <div class="my-pick-card">
                    <div class="main-pick-section">
                        <div class="pick-header">
                            <span class="trophy-icon">🏆</span>
                            <div>
                                <div class="pick-label">MY PICK (WINNER)</div>
                                <h3>${myPick.name}</h3>
                            </div>
                        </div>
                        <div class="pick-stats">
                            <div class="pick-stat">
                                <span class="stat-label">Total Score</span>
                                <span class="stat-value score">${myPick.compositeScore.toFixed(0)}</span>
                            </div>
                            <div class="pick-stat">
                                <span class="stat-label">Win Prob</span>
                                <span class="stat-value">${myPick.impliedProb.toFixed(1)}%</span>
                            </div>
                            <div class="pick-stat">
                                <span class="stat-label">RPR</span>
                                <span class="stat-value">${myPick.rpr || 'N/A'}</span>
                            </div>
                        </div>
                        ${(myPick.isEliteTrainer || myPick.disagreement) ?
                        `<div class="pick-badge-row">
                                ${myPick.isEliteTrainer ? '<span class="strategy-badge expert">🎩 ELITE TRAINER</span>' : ''}
                                ${myPick.marketMove === 'steamer' ? `<span class="mover-badge steamer">🔥 STEAMER (-${myPick.movePercent}%)</span>` : ''}
                                ${myPick.marketMove === 'drifter' ? `<span class="mover-badge drifter">❄️ DRIFTER (+${myPick.movePercent}%)</span>` : ''}
                                ${myPick.disagreement ? '<span class="strategy-badge" style="background:rgba(255,69,0,0.15); color:#ff4500; border:1px solid rgba(255,69,0,0.3);">⚠️ HIGH RISK/REWARD</span>' : ''}
                            </div>`
                        : ''
                    }
                    </div>
                    
                    ${eachWayHtml}
                </div>
                `;
            }

            let tableHeader = `
                <thead>
                    <tr>
                        <th class="sticky-col">Horse <span class="market-consensus-label">(Market Consensus)</span></th>
                        <th>TS</th>
                        <th>OR</th>
                        <th>RPR</th>
                        ${bookmakers.map(bk => `<th>${bk}</th>`).join('')}
                    </tr>
                </thead>
            `;

            let tableBody = `<tbody>
                ${race.horses.map((horse, index) => {
                const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : '';

                // Highlight high RPR
                const rprVal = parseInt(horse.rpr) || 0;
                const rprClass = rprVal > 150 ? 'rpr-high' : 'rpr-normal';

                return `
                    <tr>
                        <td class="sticky-col horse-name-cell ${rankClass}">
                            <div class="horse-info">
                    <tr>
                        <td class="sticky-col">
                            <div class="horse-name-cell ${rankClass}">
                                <div class="horse-info">
                                    <span class="horse-name">${horse.name}</span>
                                </div>
                                <div class="badges-row">
                                    ${index === 0 ? '<span class="fav-badge">FAV</span>' : ''}
                                    ${horse.marketMove === 'steamer' ? `<span class="mover-badge steamer">🔥 STEAMER (-${horse.movePercent}%)</span>` : ''}
                                    ${horse.marketMove === 'drifter' ? `<span class="mover-badge drifter">❄️ DRIFTER (+${horse.movePercent}%)</span>` : ''}
                                    ${horse.disagreement ? '<span class="disagreement-badge" title="High Bookmaker Disagreement: Possible Hidden Edge">⚠️ DISAGREEMENT</span>' : ''}
                                    ${myPick && horse.name === myPick.name ? '<span class="pick-badge">🏆 TOP PICK</span>' : ''}
                                    ${(!myPick || horse.name !== myPick.name) && horse.compositeScore > 80 ? '<span class="pick-badge" style="background: linear-gradient(135deg, #444, #666);">⭐ CONTENDER</span>' : ''}
                                </div>
                                ${horse.isHot ? '<span class="strategy-badge" style="background:rgba(255,69,0,0.2); color:#ff4500; border:1px solid #ff4500;">🔥 HOT FORM</span>' : ''}
                                ${horse.isCold ? '<span class="strategy-badge" style="background:rgba(0,191,255,0.2); color:#00bfff; border:1px solid #00bfff;">❄️ COLD</span>' : ''}
                            </div>
                            <div class="consensus-bar-container" title="Implied Probability: ${horse.impliedProb.toFixed(1)}% | SD: ${horse.stdDev.toFixed(2)}%">
                                <div class="consensus-bar" style="width: ${horse.impliedProb}%"></div>
                            </div>
                            <div class="avg-odds">${horse.averageOdds.toFixed(2)} (${horse.impliedProb.toFixed(1)}%)</div>
                            <div class="horse-detailed-stats">
                                <span>Age: ${horse.age || '-'}</span>
                                <span class="separator">•</span>
                                <span>Wgt: ${horse.weight || '-'}</span>
                                <span class="separator">•</span>
                                <span>Form: ${horse.form || '-'}</span>
                                <span class="separator">•</span>
                                <span class="trainer-inline">T: ${horse.trainer || '-'}</span>
                            </div>
                        </td>
                        <td class="score-cell">${horse.compositeScore.toFixed(0)}</td>
                        <td>${horse.officialRating || '-'}</td>
                        <td class="${rprClass}">${horse.rpr || '-'}</td>
                        ${bookmakers.map(bk => {
                    const odds = horse.odds[bk];
                    if (!odds) return '<td>-</td>';

                    const dec = fractionToDecimal(odds.fraction);
                    // Valid logic: is this quote significantly higher than average?
                    // Threshold: 20% higher than average (1.2x)
                    const isValueBet = (dec > horse.averageOdds * 1.2);

                    const cellClass = isValueBet ? 'odds-cell value-bet' : 'odds-cell';

                    return `<td class="${cellClass}" title="Decimal: ${dec.toFixed(2)}">${odds.fraction}</td>`;
                }).join('')}
                    </tr>
                `}).join('')
                }
            </tbody > `;

            container.innerHTML = `
                ${myPickHtml}
                <div class="race-header-large">
                    <h2>
                        ${race.name.replace(/Betting Odds[-–—]?\s*Winner/gi, '').trim()}
                        <span class="last-updated">🕒 Updated: ${timeAgo}</span>
                    </h2>
                    <div class="badges">
                        <div class="strategy-badge">Outlier Hunter Active</div>
                        <div class="strategy-badge consensus">Weighted Consensus Model</div>
                        <div class="strategy-badge expert">Expert Insight Active</div>
                    </div>
                </div>
                
                <!-- Synced Scrollbar TOP -->
                <div class="sync-scroll-container" id="scroll-top-${index}">
                    <div class="scroll-spacer"></div>
                </div>

                <div class="table-wrapper" id="table-wrapper-${index}">
                    <table class="odds-table">
                        ${tableHeader}
                        ${tableBody}
                    </table>
                </div>

                <!-- Synced Scrollbar BOTTOM -->
                <div class="sync-scroll-container" id="scroll-bottom-${index}">
                    <div class="scroll-spacer"></div>
                </div>
            `;

            racesGrid.appendChild(container);

            // Initialize Scrolled Sync Logic
            setTimeout(() => {
                const tableWrapper = document.getElementById(`table-wrapper-${index}`);
                const scrollTop = document.getElementById(`scroll-top-${index}`);
                const scrollBottom = document.getElementById(`scroll-bottom-${index}`);
                const stickyCol = tableWrapper.querySelector('.sticky-col');

                if (tableWrapper && scrollTop && scrollBottom && stickyCol) {
                    const stickyWidth = stickyCol.offsetWidth;
                    const scrollWidth = tableWrapper.scrollWidth;
                    const clientWidth = tableWrapper.clientWidth;

                    // Only show custom scrollbars if scrolling is needed
                    if (scrollWidth > clientWidth) {
                        // Offset the scrollbars to start after the sticky column
                        scrollTop.style.marginLeft = `${stickyWidth}px`;
                        scrollTop.style.width = `calc(100% - ${stickyWidth}px)`;

                        scrollBottom.style.marginLeft = `${stickyWidth}px`;
                        scrollBottom.style.width = `calc(100% - ${stickyWidth}px)`;

                        // Set the inner spacer width to match the FULL table scroll width
                        // Because the container is narrower (offset by sticky), scrolling this full width inside it
                        // will behave identically to the table scrolling inside its full-width wrapper (which is also clipped).
                        const totalScrollWidth = tableWrapper.scrollWidth;
                        scrollTop.querySelector('.scroll-spacer').style.width = `${totalScrollWidth}px`;
                        scrollBottom.querySelector('.scroll-spacer').style.width = `${totalScrollWidth}px`;

                        // Sync Logic with Loop Prevention
                        let isSyncing = false;

                        const syncHelper = (source, target1, target2) => {
                            if (isSyncing) return;
                            isSyncing = true;

                            target1.scrollLeft = source.scrollLeft;
                            target2.scrollLeft = source.scrollLeft;

                            // Reset flag after a brief moment
                            requestAnimationFrame(() => {
                                isSyncing = false;
                            });
                        };

                        tableWrapper.addEventListener('scroll', () => syncHelper(tableWrapper, scrollTop, scrollBottom));
                        scrollTop.addEventListener('scroll', () => syncHelper(scrollTop, tableWrapper, scrollBottom));
                        scrollBottom.addEventListener('scroll', () => syncHelper(scrollBottom, tableWrapper, scrollTop));
                    } else {
                        scrollTop.style.display = 'none';
                        scrollBottom.style.display = 'none';
                    }
                }
            }, 100); // Slight delay for rendering
        });
    }
});
