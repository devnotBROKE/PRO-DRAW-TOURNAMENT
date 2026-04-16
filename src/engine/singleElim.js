// ============================================
// Single Elimination Engine
// ============================================
import { getRoundName } from '../lib/constants.js';

// Fisher-Yates shuffle
export function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function buildSingleElimBracket(participants, simulateResults = false) {
  const n = participants.length;
  const totalRounds = Math.ceil(Math.log2(n));
  const bracketSize = Math.pow(2, totalRounds);
  
  // Pad with BYEs
  const padded = [...participants];
  while (padded.length < bracketSize) {
    padded.push(null); // BYE
  }

  const rounds = [];
  let currentMatchups = [];

  // Round 1: Create initial matchups
  for (let i = 0; i < padded.length; i += 2) {
    const team1 = padded[i];
    const team2 = padded[i + 1];
    
    let winner = null;
    let score1 = null;
    let score2 = null;

    if (team1 === null && team2 === null) {
      winner = null;
    } else if (team1 === null) {
      winner = team2; // BYE
    } else if (team2 === null) {
      winner = team1; // BYE
    } else if (simulateResults) {
      // Random winner
      score1 = Math.floor(Math.random() * 4);
      score2 = Math.floor(Math.random() * 4);
      if (score1 === score2) score1 += 1; // No draw in elimination
      winner = score1 > score2 ? team1 : team2;
    }

    currentMatchups.push({
      id: `r1-m${Math.floor(i / 2) + 1}`,
      round: 1,
      matchNum: Math.floor(i / 2) + 1,
      team1,
      team2,
      score1,
      score2,
      winner,
      isBye: team1 === null || team2 === null
    });
  }

  rounds.push({
    roundNum: 1,
    name: getRoundName(1, totalRounds),
    matches: currentMatchups
  });

  // Subsequent rounds
  for (let r = 2; r <= totalRounds; r++) {
    const prevMatches = rounds[r - 2].matches;
    const nextMatchups = [];

    for (let i = 0; i < prevMatches.length; i += 2) {
      const team1 = prevMatches[i]?.winner || null;
      const team2 = prevMatches[i + 1]?.winner || null;

      let winner = null;
      let score1 = null;
      let score2 = null;

      if (team1 && team2 && simulateResults) {
        score1 = Math.floor(Math.random() * 4);
        score2 = Math.floor(Math.random() * 4);
        if (score1 === score2) score1 += 1;
        winner = score1 > score2 ? team1 : team2;
      } else if (team1 && !team2) {
        winner = team1;
      } else if (!team1 && team2) {
        winner = team2;
      }

      nextMatchups.push({
        id: `r${r}-m${Math.floor(i / 2) + 1}`,
        round: r,
        matchNum: Math.floor(i / 2) + 1,
        team1,
        team2,
        score1,
        score2,
        winner,
        isBye: false
      });
    }

    rounds.push({
      roundNum: r,
      name: getRoundName(r, totalRounds),
      matches: nextMatchups
    });
  }

  const finalMatch = rounds[rounds.length - 1]?.matches[0];
  const champion = finalMatch?.winner || null;

  return {
    format: 'gugur',
    rounds,
    totalRounds,
    champion,
    participants
  };
}

// Build bracket with fixed winner (for admin hack)
export function buildFixedBracket(participants, targetWinner) {
  // Place target winner in a favorable position and rig results
  const others = participants.filter(p => p !== targetWinner);
  const shuffledOthers = shuffle(others);
  
  // Put target winner first, then rebuild
  const ordered = [targetWinner, ...shuffledOthers];
  
  const bracket = buildSingleElimBracket(ordered, false);
  
  // Simulate with target winner always winning
  bracket.rounds.forEach(round => {
    round.matches.forEach(match => {
      if (match.team1 === null || match.team2 === null) {
        match.winner = match.team1 || match.team2;
        return;
      }
      if (!match.team1 || !match.team2) return;
      
      const hasTarget = match.team1 === targetWinner || match.team2 === targetWinner;
      
      match.score1 = Math.floor(Math.random() * 3) + 1;
      match.score2 = Math.floor(Math.random() * 3) + 1;
      
      if (hasTarget) {
        // Target must win
        if (match.team1 === targetWinner) {
          match.score1 = Math.max(match.score1, match.score2 + 1);
        } else {
          match.score2 = Math.max(match.score2, match.score1 + 1);
        }
        match.winner = targetWinner;
      } else {
        if (match.score1 === match.score2) match.score1 += 1;
        match.winner = match.score1 > match.score2 ? match.team1 : match.team2;
      }
    });

    // Propagate winners to next round
    const nextRound = bracket.rounds.find(r => r.roundNum === round.roundNum + 1);
    if (nextRound) {
      for (let i = 0; i < round.matches.length; i += 2) {
        const nextMatch = nextRound.matches[Math.floor(i / 2)];
        if (nextMatch) {
          nextMatch.team1 = round.matches[i]?.winner || null;
          nextMatch.team2 = round.matches[i + 1]?.winner || null;
        }
      }
      // Re-simulate next round matches
      nextRound.matches.forEach(match => {
        if (!match.team1 || !match.team2) {
          match.winner = match.team1 || match.team2;
          return;
        }
        const hasTarget = match.team1 === targetWinner || match.team2 === targetWinner;
        match.score1 = Math.floor(Math.random() * 3) + 1;
        match.score2 = Math.floor(Math.random() * 3) + 1;
        if (hasTarget) {
          if (match.team1 === targetWinner) {
            match.score1 = Math.max(match.score1, match.score2 + 1);
          } else {
            match.score2 = Math.max(match.score2, match.score1 + 1);
          }
          match.winner = targetWinner;
        } else {
          if (match.score1 === match.score2) match.score1 += 1;
          match.winner = match.score1 > match.score2 ? match.team1 : match.team2;
        }
      });
    }
  });

  bracket.champion = targetWinner;
  return bracket;
}
