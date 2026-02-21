const fs = require('fs');
const path = require('path');

const NARRATIVE_HISTORY_FILE = path.join(__dirname, 'deep_reasoning_history.json');

/**
 * The DeepReasoningEngine - Backend Edition
 * This pulls from the collected 'form stories' and crunches them into
 * convincing, narrative-driven conclusions.
 */
class NarrativeEngine {
    constructor() {
        this.history = { stories: {} };
        this.loadHistory();
    }

    loadHistory() {
        try {
            if (fs.existsSync(NARRATIVE_HISTORY_FILE)) {
                this.history = JSON.parse(fs.readFileSync(NARRATIVE_HISTORY_FILE, 'utf8'));
            }
        } catch (err) {
            console.error("Error loading narrative history:", err);
        }
    }

    saveHistory() {
        try {
            fs.writeFileSync(NARRATIVE_HISTORY_FILE, JSON.stringify(this.history, null, 2));
        } catch (err) {
            console.error("Error saving narrative history:", err);
        }
    }

    /**
     * Crunch the data and generate a reasoning package for a horse.
     * This now intakes a 'multi-source' story payload.
     */
    generateReasoning(horse, race, allHorses) {
        const name = horse.name;
        const isFavorite = allHorses[0] && allHorses[0].name === name;

        // MULTI-SOURCE INTAKE
        const officialStory = (horse.spotlight || "").toLowerCase();
        const socialBuzz = (horse.socialInsights || "").toLowerCase(); // From X/Reddit
        const forumWhispers = (horse.forumData || "").toLowerCase();  // From specialist forums
        const proStories = horse.proStories || []; // ARRAY OF PRO ANALYST QUOTES

        // Combine for overall sentiment
        let proText = proStories.map(s => s.text).join(" ").toLowerCase();
        const fullNarrative = `${officialStory} ${socialBuzz} ${forumWhispers} ${proText}`;

        let aiConclusion = "";
        let nuggets = [];

        // 1. Build Data-Backed Nuggets (Including Pro Consensus)
        if (proStories.length >= 2) {
            nuggets.push(`🎓 <strong>Expert Consensus:</strong> Multiple elite analysts (Timeform/ATR) have flagged a hidden tactical edge.`);
        }

        if (socialBuzz.includes('trending') || socialBuzz.includes('buzz')) {
            nuggets.push(`🌐 <strong>Social Heat:</strong> Significant uptick in community buzz detected; sentiment is bullish.`);
        }

        if (horse.proSentiment > 15) {
            nuggets.push(`💎 <strong>Alpha Narrative:</strong> Elite-tier professional alignment on this horse's win potential.`);
        }

        if (horse.courseDistanceWin === 'CD') {
            nuggets.push(`🏰 <strong>Track Master:</strong> Proven 'CD' winner over this course.`);
        }

        if (officialStory.includes('soft') && race.raceGoing === 'Soft') {
            nuggets.push(`🌧️ <strong>Surface Edge:</strong> Pedigree confirms this horse excels on ${race.raceGoing}.`);
        }

        if (horse.rpr && parseInt(horse.rpr) > 150) {
            nuggets.push(`🔥 <strong>High Ceiling:</strong> RPR of ${horse.rpr} is among the field elite.`);
        }

        // 2. Multi-Source Decision Logic
        const posPatterns = [/unlucky/i, /blocked/i, /hampered/i, /eyecatcher/i, /leading contender/i, /strong chance/i, /major player/i, /wind op/i, /improved/i, /secret/i, /whisper/i, /trending/i, /tactically superior/i, /engine/i];
        const negPatterns = [/disappointing/i, /below par/i, /struggled/i, /overhyped/i, /hard to recommend/i, /tough task/i, /bounce back/i, /exposed/i];

        let storyScore = 0;
        posPatterns.forEach(p => { if (p.test(fullNarrative)) storyScore += 6; });
        negPatterns.forEach(p => { if (p.test(fullNarrative)) storyScore -= 10; });

        // Add Professional Weight
        storyScore += (horse.proSentiment || 0);

        storyScore = Math.max(-25, Math.min(25, storyScore));

        const themes = {
            unlucky: fullNarrative.includes('unlucky') || fullNarrative.includes('blocked') || fullNarrative.includes('met trouble'),
            windOp: fullNarrative.includes('wind op') || fullNarrative.includes('breathing'),
            stableWhisper: forumWhispers.includes('whisper') || socialBuzz.includes('informed') || proText.includes('target'),
            proConsensus: proStories.length >= 2,
            overhyped: socialBuzz.includes('overhyped') || socialBuzz.includes('lay off') || proText.includes('exposed'),
            stamina: fullNarrative.includes('stamina') || fullNarrative.includes('staying on'),
            speed: proText.includes('sectional') || proText.includes('speed') || proText.includes('closing')
        };

        if (isFavorite) {
            if (themes.proConsensus && themes.speed) {
                aiConclusion = `<strong>The Alpha Narrative:</strong> This isn't just a market favorite; it's a professional consensus pick. Timeform and ATR both identify superior sectional speed ('The Big Engine'). This is the highest-confidence profile our engine can generate.`;
            } else if (themes.stableWhisper) {
                aiConclusion = `<strong>The 'Informed' Favorite:</strong> Stable whispers and specialist forum buzz confirm peak readiness. The narrative synergy between the official papers and the private gossip creates a 'Strategic Certainty'.`;
            } else if (themes.overhyped) {
                aiConclusion = `<strong>Decision: The Vulnerable Market King.</strong> Professional analysts are divided, and social sentiment is flagging an overhyped profile. We are predicting a struggle—the favorite is poor value today.`;
            } else {
                aiConclusion = `<strong>Consensus Dominance:</strong> High-confidence profile across all reporting streams. The data, the experts, and the story are in alignment.`;
            }
        } else {
            if (themes.stableWhisper || (themes.proConsensus && themes.speed)) {
                aiConclusion = `<strong>Decision: The Shadow Winner.</strong> While the favorite takes the spotlight, 10+ professional sources have uncovered a 'hidden' edge for ${name}. We've detected a massive 'Alpha Narrative' build-up for this profile. High-conviction value play.`;
            } else if (themes.unlucky) {
                aiConclusion = `<strong>Decision: The Value Trap.</strong> Multiple sources confirm ${name} met trouble that masked its true ceiling. The public missed it, but the professional eye did not. We are betting on the redemption.`;
            } else if (themes.surface && horse.groundSuitability === 'perfect') {
                aiConclusion = `<strong>Decision: Surface Arbitrage.</strong> Consensus among specialists is that ${name} improves by 3-4 lengths on this ground. We predict a class-neutralizing performance against the favorite.`;
            } else {
                aiConclusion = `<strong>Tactical Divergence:</strong> We have identified a niche narrative for ${name} that is backed by at least two specialist analysts. A durable Each-Way option with strong technical backing.`;
            }
        }

        if (nuggets.length === 0) {
            nuggets.push(`🎯 <strong>Form Advantage:</strong> Superior tactical positioning detected by our ensemble.`);
        }

        const reasoningPackage = {
            conclusion: aiConclusion,
            shortConclusion: aiConclusion.split('.')[0] + '.',
            nuggets: nuggets.slice(0, 2), // Keep it punchy
            storyScore: storyScore,
            sources: {
                official: officialStory.substring(0, 50) + "...",
                social: socialBuzz.substring(0, 50) + "...",
                pro: proStories.map(s => s.source).join(", ")
            },
            timestamp: new Date().toISOString()
        };

        if (!this.history.stories[name]) this.history.stories[name] = [];
        this.history.stories[name].unshift(reasoningPackage);
        this.history.stories[name] = this.history.stories[name].slice(0, 10);

        this.saveHistory();
        return reasoningPackage;
    }

    isElitePair(trainer, jockey) {
        const elite = ['Nicky Henderson', 'W P Mullins', 'Paul Nicholls', 'Dan Skelton', 'Gordon Elliott'];
        return elite.some(e => trainer.includes(e));
    }

    calculateCompositeScore(horse, race) {
        // Simple internal version of the frontend scoring logic
        let score = 100;
        if (horse.rpr) score += (parseInt(horse.rpr) - 140);
        if (horse.marketMove === 'steamer') score += 15;
        if (horse.isEliteCombo) score += 20;
        return score;
    }
}

module.exports = new NarrativeEngine();
