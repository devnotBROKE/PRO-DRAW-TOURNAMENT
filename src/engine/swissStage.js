// ============================================
// Swiss Stage Engine
// ============================================
import { shuffle } from './singleElim.js';

export function buildSwissStage(participants, numRounds = null) {
  const n = participants.length;
  if (!numRounds) numRounds = Math.ceil(Math.log2(n));
  numRounds = Math.min(numRounds, n - 1); // Can't have more rounds than n-1

  const shuffled = shuffle(participants);

  // Track opponents to avoid rematches
  const opponents = {};
  shuffled.forEach(name => {
    opponents[name] = [];
  });

  const rounds = [];

  for (let r = 1; r <= numRounds; r++) {
    // For round 1, use shuffled order. For later rounds, just reorder to avoid rematches
    const available = [...shuffled];
    
    // Simple round-robin-like shifting for subsequent rounds
    if (r > 1) {
      // Rotate the order for variety
      for (let shift = 0; shift < r - 1; shift++) {
        available.push(available.shift());
      }
    }

    const paired = new Set();
    const pairings = [];

    for (let i = 0; i < available.length; i++) {
      if (paired.has(available[i])) continue;

      // Find opponent: next unpaired player they haven't faced
      let opponent = null;
      for (let j = i + 1; j < available.length; j++) {
        if (!paired.has(available[j]) && !opponents[available[i]].includes(available[j])) {
          opponent = available[j];
          break;
        }
      }

      // Fallback: any unpaired player
      if (!opponent) {
        for (let j = i + 1; j < available.length; j++) {
          if (!paired.has(available[j])) {
            opponent = available[j];
            break;
          }
        }
      }

      if (opponent) {
        paired.add(available[i]);
        paired.add(opponent);

        pairings.push({
          team1: available[i],
          team2: opponent
        });

        // Track opponents
        opponents[available[i]].push(opponent);
        opponents[opponent].push(available[i]);
      }
    }

    // Handle BYE if odd number
    const unpaired = available.filter(s => !paired.has(s));
    unpaired.forEach(p => {
      pairings.push({
        team1: p,
        team2: 'BYE'
      });
    });

    rounds.push({
      roundNum: r,
      name: `Round ${r}`,
      pairings
    });
  }

  return {
    format: 'swiss',
    rounds,
    totalRounds: numRounds,
    participants
  };
}
