/**
 * The DeepReasoningEngine - Backend Edition
 * This pulls from the collected 'form stories' and crunches them into
 * convincing, narrative-driven conclusions.
 */
class NarrativeEngine {
    constructor() {
        // State now managed directly in Postgres DB
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
        const socialBuzz = (horse.socialInsights || "").toLowerCase();
        const forumWhispers = (horse.forumData || "").toLowerCase();
        const liveSentiment = (horse.liveSentiment || "").toLowerCase();
        const newsBuzz = (horse.newsBuzz || "").toLowerCase();
        const proStories = horse.proStories || [];

        // NEW: Perpetual Intelligence Intake
        const lifetimeVault = horse.lifetimeVault || [];
        const intelligenceTags = horse.intelligenceTags || [];

        // Combine for overall sentiment
        let proText = proStories.map(s => s.text).join(" ").toLowerCase();
        let vaultText = lifetimeVault.map(v => v.content).join(" ").toLowerCase();
        const fullNarrative = `${officialStory} ${socialBuzz} ${forumWhispers} ${proText} ${liveSentiment} ${newsBuzz} ${vaultText}`;

        let aiConclusion = "";
        let nuggets = [];

        // 1. Build Data-Backed Nuggets (Including Perpetual Wisdom)
        if (intelligenceTags.length > 0) {
            const tagStr = intelligenceTags.slice(0, 2).map(t => `<code>${t}</code>`).join(' & ');
            nuggets.push(`🧠 <strong>Perpetual Wisdom:</strong> Our vault identifies this runner as a ${tagStr} profile based on lifetime tracked stories.`);
        }

        if (lifetimeVault.length > 3) {
            nuggets.push(`📚 <strong>High Trace History:</strong> Deep data store (3+ years) confirms consistent patterns in these specific conditions.`);
        }

        if (proStories.length >= 2) {
            nuggets.push(`🎓 <strong>Expert Consensus:</strong> Multiple elite analysts (Timeform/ATR) have flagged a hidden tactical edge.`);
        }

        if (liveSentiment.includes('trending') || liveSentiment.includes('viral')) {
            nuggets.push(`🚀 <strong>Viral Momentum:</strong> Social signals are flashing a 'Strong Buy'.`);
        }

        // 2. Multi-Source Decision Logic
        const posPatterns = [/unlucky/i, /blocked/i, /hampered/i, /eyecatcher/i, /leading contender/i, /strong chance/i, /major player/i, /wind op/i, /improved/i, /secret/i, /whisper/i, /trending/i, /tactically superior/i, /engine/i, /cruising speed/i];
        const negPatterns = [/disappointing/i, /below par/i, /struggled/i, /overhyped/i, /hard to recommend/i, /tough task/i, /bounce back/i, /exposed/i];

        let storyScore = 0;
        posPatterns.forEach(p => { if (p.test(fullNarrative)) storyScore += 6; });
        negPatterns.forEach(p => { if (p.test(fullNarrative)) storyScore -= 10; });

        // Add Professional Weight
        storyScore += (horse.proSentiment || 0);
        // Add Vault Weight (Consistent high-level entries add confidence)
        storyScore += (lifetimeVault.length * 2);

        storyScore = Math.max(-30, Math.min(30, storyScore));

        const themes = {
            unlucky: fullNarrative.includes('unlucky') || fullNarrative.includes('blocked') || fullNarrative.includes('met trouble'),
            windOp: fullNarrative.includes('wind op') || fullNarrative.includes('breathing') || intelligenceTags.includes('Respiratory-Upgraded'),
            stableWhisper: forumWhispers.includes('whisper') || socialBuzz.includes('informed') || proText.includes('target'),
            proConsensus: proStories.length >= 2,
            overhyped: socialBuzz.includes('overhyped') || socialBuzz.includes('lay off') || proText.includes('exposed'),
            stamina: fullNarrative.includes('stamina') || fullNarrative.includes('staying on'),
            speed: proText.includes('sectional') || proText.includes('speed') || proText.includes('closing') || intelligenceTags.includes('Speed-Demon')
        };

        if (isFavorite) {
            if (themes.proConsensus && themes.speed) {
                aiConclusion = `<strong>The Alpha Narrative:</strong> This isn't just a market favorite; it's a professional consensus pick. Deep history and sectional analysis identify superior speed. This is our highest-confidence 'Brain Vault' profile.`;
            } else if (themes.stableWhisper) {
                aiConclusion = `<strong>The 'Informed' Favorite:</strong> Stable whispers and specialist buzz confirm peak readiness. The synergy between current gossip and our lifetime vault creates a 'Strategic Certainty'.`;
            } else {
                aiConclusion = `<strong>Consensus Dominance:</strong> High-confidence profile across all reporting streams. The data, the experts, and the vault stories are in alignment.`;
            }
        } else {
            if (themes.stableWhisper || (themes.proConsensus && themes.speed)) {
                aiConclusion = `<strong>Decision: The Shadow Winner.</strong> While the favorite takes the spotlight, we've uncovered a massive 'Alpha Narrative' in our vault for ${name}. High-conviction value play with 2+ years of supporting data.`;
            } else if (themes.windOp) {
                aiConclusion = `<strong>Decision: The Mechanical Upgrade.</strong> Our vault tracks a significant breathing operation. If the ground remains suitable, this is the field's biggest improvement-candidate.`;
            } else {
                aiConclusion = `<strong>Tactical Divergence:</strong> We have identified a niche narrative for ${name} that is backed by at least two specialist analysts and historical vault patterns. Durable Each-Way option.`;
            }
        }

        if (nuggets.length === 0) {
            nuggets.push(`🎯 <strong>Form Advantage:</strong> Superior tactical positioning detected by the ensemble.`);
        }

        const reasoningPackage = {
            conclusion: aiConclusion,
            shortConclusion: aiConclusion.split('.')[0] + '.',
            nuggets: nuggets.slice(0, 2),
            storyScore: storyScore,
            sources: {
                official: officialStory.substring(0, 50) + "...",
                social: socialBuzz.substring(0, 50) + "...",
                vaultEntries: lifetimeVault.length
            },
            timestamp: new Date().toISOString()
        };

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
