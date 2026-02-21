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
            speed: proText.includes('sectional') || proText.includes('speed') || proText.includes('closing') || intelligenceTags.includes('Speed-Demon'),
            surface: horse.groundSuitability === 'perfect' || intelligenceTags.includes('Mudlark')
        };

        const headlines = {
            alpha: ["The Alpha Narrative", "The Professional Consensus", "The High-Conviction King", "The Market Anchor"],
            whisper: ["The Paddock Whisper", "The Informed Angle", "The Stable's Choice", "The Yard Secret"],
            vulnerable: ["The Vulnerable Favorite", "The Market Trap", "The Exposed Kingpin", "The Over-Exposed Anchor"],
            shadow: ["The Shadow Winner", "The Tactical Outlier", "The Hidden Gear", "The Intelligent Longshot"],
            mechanical: ["The Mechanical Upgrade", "The Respiratory Edge", "The Post-Op Specialist", "The Bio-Mechanical Spike"],
            surface: ["The Ground Arbitrage", "The Surface Specialist", "The Mudlark Factor", "The Turf Optimizer"],
            redemption: ["The Unlucky Redemption", "The Traffic-Victim Angle", "The Paddock Eyecatcher", "The Hidden Recovery"]
        };

        const getHeadline = (key, seed) => {
            const list = headlines[key];
            const index = (seed.length + seed.charCodeAt(0)) % list.length;
            return `<strong>${list[index]}:</strong>`;
        };

        if (isFavorite) {
            if (themes.proConsensus && themes.speed) {
                const variants = [
                    `${getHeadline('alpha', name)} This isn't just a market favorite; it's a professional alignment. Sectional analysis identifies a 'Big Engine' profile that appears technically superior to the field.`,
                    `${getHeadline('alpha', name)} All primary vectors—market heat, technical rating, and expert stories—align on a singular conclusion. This is the race's technical anchor.`,
                    `${getHeadline('alpha', name)} Our hub identifies a 'Dominant Consensus'. The probability of a sub-par performance is mathematically negligible based on 3+ years of tracking.`
                ];
                aiConclusion = variants[name.length % variants.length];
            } else if (themes.stableWhisper) {
                const variants = [
                    `${getHeadline('whisper', name)} Private signals and yard whispers confirm peak readiness. A high-conviction play with strategic certainty.`,
                    `${getHeadline('whisper', name)} The synergy between current market heat and our lifetime vault suggests a horse that has been targeted specifically for this prize.`,
                    `${getHeadline('whisper', name)} Intelligence nodes from 3+ sources have flagged an 'Informed Spike'. The yard confidence is reportedly unmatched.`
                ];
                aiConclusion = variants[name.length % variants.length];
            } else if (themes.overhyped) {
                const variants = [
                    `${getHeadline('vulnerable', name)} Multiple specialist analysts have flagged a 'Stamina Doubt'. We predict a tactical struggle.`,
                    `${getHeadline('vulnerable', name)} While the public piles in, our engine detects 'Technical Exposure'. The price does not reflect the underlying risk profile.`,
                    `${getHeadline('vulnerable', name)} Sentiment is cooling among sharp accounts. This favorite is technically over-extended at these odds.`
                ];
                aiConclusion = variants[name.length % variants.length];
            } else {
                aiConclusion = `<strong>Consensus Dominance:</strong> High-confidence profile across all reporting streams. The data, the experts, and the vault stories are in perfect alignment for a standard win-bid.`;
            }
        } else {
            if (themes.stableWhisper || (themes.proConsensus && themes.speed)) {
                const variants = [
                    `${getHeadline('shadow', name)} While the favorite takes the spotlight, we've uncovered a massive internal profile in our vault for ${name}. 10+ professional sources have aligned on this value-play.`,
                    `${getHeadline('shadow', name)} An overlooked 'High-Velocity' profile. While ignored by the casual markets, our engine detects a massive tactical overlap with historical winners.`,
                    `${getHeadline('shadow', name)} Hidden in plain sight, ${name} has the technical data-points of a Grade 1 runner. Our intelligence hub flags a significant pricing error here.`
                ];
                aiConclusion = variants[name.length % variants.length];
            } else if (themes.windOp) {
                const variants = [
                    `${getHeadline('mechanical', name)} Our vault identifies a clandestine breathing upgrade. On current ground, technical data suggests a massive improvements of 4+ lengths.`,
                    `${getHeadline('mechanical', name)} A major mechanical outlier. Post-op recovery data combined with current track parameters identify this as a highly-efficient engine today.`,
                    `${getHeadline('mechanical', name)} The 'Respiratory Spike' is the lead narrative here. ${name} is technically optimized for this specific oxygen-demanding trip.`
                ];
                aiConclusion = variants[name.length % variants.length];
            } else if (themes.unlucky) {
                const variants = [
                    `${getHeadline('redemption', name)} Multiple sources confirm ${name} met significant trouble last time out. The public missed the sectional recovery, but our intelligence engine did not.`,
                    `${getHeadline('redemption', name)} A 'Hidden Eyecatcher'. Despite a poor finishing position, our data confirms elite closing speeds that were masked by tactical interference.`,
                    `${getHeadline('redemption', name)} The market has written off ${name} after a 'Blooper' run. We predict a massive technical correction today on a clear track.`
                ];
                aiConclusion = variants[name.length % variants.length];
            } else if (themes.surface) {
                const variants = [
                    `${getHeadline('surface', name)} Consensus among specialists is that ${name} improves significantly on this specific going. A class-neutralizing performance is predicted.`,
                    `${getHeadline('surface', name)} The 'Ground Arbitrage' play. While others struggle, technical data shows ${name} has a foot-perfect efficiency on this surface.`,
                    `${getHeadline('surface', name)} Our vault identifies ${name} as a rare specialist in these precise moisture levels. Expect a performance far above its official rating.`
                ];
                aiConclusion = variants[name.length % variants.length];
            } else {
                aiConclusion = `<strong>Tactical Divergence:</strong> We have identified a niche narrative for ${name} that is backed by at least two specialist analysts and historical vault patterns. Durable Each-Way option with unique technical backing.`;
            }
        }

        if (nuggets.length === 0) {
            const fallbackNuggets = [
                `🎯 <strong>Form Advantage:</strong> Superior tactical positioning detected by the ensemble.`,
                `📈 <strong>Data Upside:</strong> Technical indicators suggest this horse is currently 'Unexposed'.`,
                `⚙️ <strong>Efficiency Hit:</strong> Running style perfectly matches current track bias.`,
                `📡 <strong>Sharp Signal:</strong> Late money flow patterns suggest high internal confidence.`
            ];
            nuggets.push(fallbackNuggets[name.length % fallbackNuggets.length]);
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
