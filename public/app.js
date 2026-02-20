document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader');
    const racesGrid = document.getElementById('races-grid');
    const loaderText = document.getElementById('loader-text');
    const raceNav = document.querySelector('.race-nav');
    const dayButtons = document.querySelectorAll('.day-btn');

    // --- PAYWALL SYSTEM ---
    const FREE_RACES = ['supreme', 'championchase'];
    let isUnlocked = sessionStorage.getItem('hrp_unlocked') === 'true';

    function isRaceFree(raceId) {
        return FREE_RACES.includes(raceId) || isUnlocked;
    }

    function unlockAllRaces() {
        isUnlocked = true;
        sessionStorage.setItem('hrp_unlocked', 'true');
        // Re-render current day's buttons to remove locks
        const activeDay = document.querySelector('.day-btn.active');
        if (activeDay) {
            renderRaceButtons(activeDay.textContent.trim());
        }
        // Close modal
        closePaywallModal();
    }

    function showPaywallModal() {
        const modal = document.getElementById('paywall-modal');
        if (modal) {
            modal.classList.add('visible');
            const input = modal.querySelector('.paywall-code-input');
            if (input) { input.value = ''; input.focus(); }
            const errorEl = modal.querySelector('.paywall-error');
            if (errorEl) errorEl.style.display = 'none';
        }
    }

    function closePaywallModal() {
        const modal = document.getElementById('paywall-modal');
        if (modal) modal.classList.remove('visible');
    }

    function handlePaywallSubmit() {
        const input = document.querySelector('.paywall-code-input');
        const errorEl = document.querySelector('.paywall-error');
        if (input && input.value.trim() === 'Optimus') {
            unlockAllRaces();
        } else {
            if (errorEl) {
                errorEl.textContent = 'Invalid code. Please try again.';
                errorEl.style.display = 'block';
            }
            if (input) {
                input.classList.add('shake');
                setTimeout(() => input.classList.remove('shake'), 500);
            }
        }
    }

    // Attach modal event listeners after DOM ready
    setTimeout(() => {
        const closeBtn = document.querySelector('.paywall-close-btn');
        if (closeBtn) closeBtn.addEventListener('click', closePaywallModal);

        const submitBtn = document.querySelector('.paywall-submit-btn');
        if (submitBtn) submitBtn.addEventListener('click', handlePaywallSubmit);

        const codeInput = document.querySelector('.paywall-code-input');
        if (codeInput) {
            codeInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') handlePaywallSubmit();
            });
        }

        const overlay = document.getElementById('paywall-modal');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) closePaywallModal();
            });
        }
    }, 0);

    // --- SUCCESS TIP CARD DISMISS ---
    setTimeout(() => {
        const tipSection = document.getElementById('success-tip');
        const tipCardCloseX = document.getElementById('tip-card-close-x');
        const tipCardCloseBtn = document.getElementById('tip-card-close-btn');

        function dismissTipCard() {
            if (tipSection) {
                tipSection.classList.add('dismissed');
                setTimeout(() => { tipSection.style.display = 'none'; }, 400);
            }
        }

        if (tipCardCloseX) tipCardCloseX.addEventListener('click', dismissTipCard);
        if (tipCardCloseBtn) tipCardCloseBtn.addEventListener('click', dismissTipCard);
    }, 0);

    // --- SUCCESS TIP MODAL ---
    setTimeout(() => {
        const tipBtn = document.getElementById('open-tip-modal');
        const tipOverlay = document.getElementById('tip-modal');
        const tipCloseBtn = document.getElementById('tip-modal-close');

        if (tipBtn && tipOverlay) {
            tipBtn.addEventListener('click', () => {
                tipOverlay.classList.add('visible');
            });
        }

        if (tipCloseBtn && tipOverlay) {
            tipCloseBtn.addEventListener('click', () => {
                tipOverlay.classList.remove('visible');
            });
        }

        const tipCloseBtnBottom = document.getElementById('tip-modal-close-btn');
        if (tipCloseBtnBottom && tipOverlay) {
            tipCloseBtnBottom.addEventListener('click', () => {
                tipOverlay.classList.remove('visible');
            });
        }

        if (tipOverlay) {
            tipOverlay.addEventListener('click', (e) => {
                if (e.target === tipOverlay) {
                    tipOverlay.classList.remove('visible');
                }
            });
        }
    }, 0);

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

            const locked = !isRaceFree(race.id);
            if (locked) btn.classList.add('locked');

            btn.innerHTML = `
                <span class="race-time">${race.time}</span>
                <span class="race-name">${race.name}${locked ? '<svg class="lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' : ''}</span>
            `;

            // Attach click listener immediately
            btn.addEventListener('click', () => {
                if (!isRaceFree(race.id)) {
                    showPaywallModal();
                } else {
                    handleRaceClick(btn);
                }
            });

            raceNav.appendChild(btn);
        });

        // Reset to empty state view when changing days
        resetView();
    }

    function resetView() {
        racesGrid.classList.remove('hidden');
        racesGrid.innerHTML = `
            <div class="empty-action">
                <!-- Clean Initial State -->
            </div>
        `;
    }

    // Day Button Logic
    dayButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            dayButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Deactivate special race button
            const specBtn = document.getElementById('special-southwell');
            if (specBtn) specBtn.classList.remove('active');

            // Render races for this day
            const selectedDay = btn.textContent.trim();
            renderRaceButtons(selectedDay);
        });
    });

    // Initialize with Tuesday
    renderRaceButtons('Tuesday');

    // --- SPECIAL RACE BUTTON ---
    const specialBtn = document.getElementById('special-southwell');
    if (specialBtn) {
        specialBtn.addEventListener('click', () => {
            // Deactivate all Cheltenham race buttons
            document.querySelectorAll('.race-btn').forEach(b => b.classList.remove('active'));
            // Activate the special button
            specialBtn.classList.add('active');
            // Use the same handler
            handleRaceClick(specialBtn);
        });
    }


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
        // Cinematic Loading Sequence with LLM Branding
        // Cinematic Loading Sequence with LLM Branding
        const loadingMessages = [
            `<span><img src="https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg" style="height:16px; vertical-align:middle; margin-right:8px; filter: invert(1);"> o3 (High-Reasoning) analyzing betting patterns...</span>`,
            `<span><img src="claude-logo.svg" style="height:24px; vertical-align:middle; margin-right:8px;"> Claude 3.7 Opus checking expert form...</span>`,
            `<span><img src="https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg" style="height:16px; vertical-align:middle; margin-right:8px;"> 2.0 Pro cross-referencing market moves...</span>`,
            `<span><img src="https://upload.wikimedia.org/wikipedia/commons/5/57/X_logo_2023_%28white%29.png" style="height:16px; vertical-align:middle; margin-right:8px;"> Grok 3 calculating velocity metrics...</span>`
        ];

        let msgIndex = 0;
        loaderText.innerHTML = loadingMessages[0]; // Use innerHTML to render logos

        // Cycle messages to show "hard work"
        const intervalId = setInterval(() => {
            msgIndex = (msgIndex + 1) % loadingMessages.length;
            loaderText.innerHTML = loadingMessages[msgIndex];
        }, 1200); // Slower read time (1.2s)

        try {
            const startTime = Date.now();
            const response = await fetch(`/api/scrape?raceId=${raceId}`);
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }

            const result = await response.json();

            // Artificial delay for "Cinematic Analysis" feel (requested by user)
            // Even if cached, we make it look like we're crunching numbers
            // Random crunch time between 3500ms and 5000ms

            const elapsed = Date.now() - startTime;
            const crunchTime = Math.floor(Math.random() * 1500) + 3000;

            if (elapsed < crunchTime) {
                await new Promise(r => setTimeout(r, crunchTime - elapsed));
            }

            // Show final success message briefly
            // Show final success message briefly
            const finalIcons = [
                'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg',
                'claude-logo.svg',
                'https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg',
                'https://upload.wikimedia.org/wikipedia/commons/5/57/X_logo_2023_%28white%29.png'
            ];
            const randomIcon = finalIcons[Math.floor(Math.random() * finalIcons.length)];
            const iconStyle = (randomIcon.includes('Gemini') || randomIcon.includes('claude')) ? '' : 'filter: invert(1);'; // Don't invert colored logos

            loaderText.innerHTML = `<span><img src="${randomIcon}" style="height:18px; vertical-align:middle; margin-right:8px; ${iconStyle}"> Finalizing Ensemble Predictions...</span>`;
            await new Promise(r => setTimeout(r, 800)); // Slightly longer pause to see the final logo


            if (result.success && result.data.length > 0) {
                console.log("Received Data:", result.data);
                renderRaces(result.data, result.lastUpdated, raceId);
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

    function renderRaces(races, lastUpdated, raceId) {
        // Detect if this is a non-Cheltenham (flat/AW) race
        const cheltenhamRaces = ['supreme', 'arkle', 'ultima', 'champion', 'mares', 'boodles', 'national', 'ballymore', 'brown', 'coral', 'championchase', 'cross', 'grandannual', 'bumper', 'turners', 'pertemps', 'ryanair', 'stayers', 'plate', 'maresnovice', 'kimmuir', 'triumph', 'county', 'bartlett', 'goldcup', 'hunters', 'mareschase', 'martinpipe'];
        const isNonCheltenham = !cheltenhamRaces.includes(raceId);
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

                // 5. Age Trends
                let ageScore = 0;
                if (horse.age) {
                    const ageVal = parseInt(horse.age);
                    if (isNonCheltenham) {
                        // Flat/AW: No age penalty, slight bonus for prime age (4-6)
                        if (ageVal >= 4 && ageVal <= 6) ageScore = 5;
                    } else {
                        // NH: Supreme Novices favors 5-6yo
                        if (ageVal === 5 || ageVal === 6) ageScore = 10; // "Golden Age"
                        else if (ageVal > 7) ageScore = -5; // Penalty for older horses in Novice hurdle
                    }
                }

                // 6. Official Rating Bonus
                let orScore = 0;
                if (horse.officialRating && horse.officialRating !== '-') {
                    const orVal = parseInt(horse.officialRating);
                    if (orVal > 145) orScore = 10; // Proven quality
                }

                // 7. Weight Advantage
                let weightScore = 0;
                if (horse.weight) {
                    const [st, lb] = horse.weight.split('-').map(Number);
                    if (isNonCheltenham) {
                        // Flat/AW: Standard is ~9-0. Lower = advantage
                        const totalLb = (st * 14) + (lb || 0);
                        if (totalLb < 126) weightScore = 10; // Under 9-0
                    } else {
                        // NH: Standard is 11-7. If less, it's an allowance (good).
                        if (st < 11 || (st === 11 && lb < 7)) {
                            weightScore = 15; // Significant weight advantage
                        }
                    }
                }

                // 8. Elite Trainer Bonus
                let trainerScore = 0;
                const nhEliteTrainers = ['mullins', 'elliott', 'henderson', 'bromhead', 'nicholls', 'skelton'];
                const flatEliteTrainers = ['appleby', 'o\'brien', 'haggas', 'gosden', 'doyle', 'stoute', 'morrison', 'balding', 'de foy', 'skelton', 'henderson', 'mullins', 'nicholls'];
                const eliteTrainers = isNonCheltenham ? flatEliteTrainers : nhEliteTrainers;
                if (horse.trainer) {
                    const t = horse.trainer.toLowerCase();
                    if (eliteTrainers.some(et => t.includes(et))) {
                        trainerScore = 15; // Significant boost for top yards
                        horse.isEliteTrainer = true;
                    }
                }

                // 9. Elite Trainer & Jockey Combo (The "Super Team" Bonus)
                let comboScore = 0;
                const eliteCombos = [
                    { t: 'mullins', j: 'townend' },
                    { t: 'henderson', j: 'boinville' },
                    { t: 'elliott', j: 'kennedy' },
                    { t: 'nicholls', j: 'cobden' },
                    { t: 'bromhead', j: 'blackmore' }
                ];

                if (horse.trainer && horse.jockey) {
                    const t = horse.trainer.toLowerCase();
                    const j = horse.jockey.toLowerCase();

                    if (eliteCombos.some(c => t.includes(c.t) && j.includes(c.j))) {
                        comboScore = 25; // MASSIVE bonus for proven deadly duos
                        horse.isEliteCombo = true;
                    }
                }

                // 10. Course & Distance Specialist (Horses for Courses)
                let cdScore = 0;
                if (horse.courseDistanceWin) {
                    if (horse.courseDistanceWin === 'CD') cdScore = 20; // Proven over this track AND trip
                    else if (horse.courseDistanceWin === 'C') cdScore = 15; // Loves Cheltenham
                    else if (horse.courseDistanceWin === 'D') cdScore = 5; // Proven stayer/sprinter
                }

                // 11. Smart Money Velocity (Real-time momentum)
                let velocityScore = 0;
                if (horse.velocity && horse.velocity < -0.1) {
                    // Dropping more than 0.1 pts per minute is significant
                    velocityScore = Math.abs(horse.velocity) * 50; // Scale up the impact
                    // Cap at 30 pts
                    if (velocityScore > 30) velocityScore = 30;
                    horse.highVelocity = true;
                }

                // 12. NLP Going Analysis (NEW: Ground Suitability)
                let goingScore = 0;
                // Fix: Access raceGoing from the 'races' array passed to this function
                // Note: 'races' corresponds to 'result.data' from the fetch
                const raceGoing = races && races.length > 0 && races[0].raceGoing ? races[0].raceGoing.toLowerCase() : "";
                const spotlight = horse.spotlight ? horse.spotlight.toLowerCase() : "";

                if (raceGoing && spotlight) {
                    const isSoft = raceGoing.includes('soft') || raceGoing.includes('heavy');
                    const isGood = raceGoing.includes('good') || raceGoing.includes('firm');

                    if (isSoft) {
                        if (spotlight.includes('won on soft') || spotlight.includes('acts on heavy') || spotlight.includes('mudlark')) {
                            goingScore = 15; // Loves the mud
                            horse.groundSuitability = 'perfect';
                        } else if (spotlight.includes('needs good') || spotlight.includes('better ground')) {
                            goingScore = -20; // Hates the mud
                            horse.groundSuitability = 'poor';
                        }
                    } else if (isGood) {
                        if (spotlight.includes('won on good') || spotlight.includes('top of the ground')) {
                            goingScore = 15;
                            horse.groundSuitability = 'perfect';
                        } else if (spotlight.includes('needs soft') || spotlight.includes('wants rain')) {
                            goingScore = -20;
                            horse.groundSuitability = 'poor';
                        }
                    }
                }

                horse.compositeScore = consensusScore + valueScore + expertScore + formScore + ageScore + orScore + trainerScore + weightScore + comboScore + cdScore + velocityScore + goingScore;
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
                            <h4 class="ew-title">🎯 Each Way Value AI Picks</h4>
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
                                <div class="pick-label">AI PICK (WINNER)</div>
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
                                    ${horse.isEliteCombo ? '<span class="strategy-badge expert" style="background:rgba(255,215,0,0.2); border-color:var(--accent-gold); color:var(--accent-gold);">⚡ DEADLY DUO</span>' : ''}
                                    ${horse.courseDistanceWin === 'CD' ? '<span class="strategy-badge" style="background:rgba(0,255,136,0.15); color:#00ff88;">🏰 TRACK SPECIALIST</span>' : ''}
                                    ${horse.highVelocity ? '<span class="strategy-badge" style="background:rgba(255,0,255,0.2); color:#ff00ff; border:1px solid #ff00ff;">🚀 VELOCITY MOVE</span>' : ''}
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
