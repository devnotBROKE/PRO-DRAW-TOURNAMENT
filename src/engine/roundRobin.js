// ============================================
// Round Robin Engine
// — Split participants into 2 Groups
// ============================================
import { shuffle } from './singleElim.js';

export function buildRoundRobin(participants) {
  const shuffled = shuffle(participants);
  const mid = Math.ceil(shuffled.length / 2);

  const group1 = shuffled.slice(0, mid);
  const group2 = shuffled.slice(mid);

  return {
    format: 'liga',
    groups: [
      { name: 'Group 1', members: group1 },
      { name: 'Group 2', members: group2 }
    ],
    participants: shuffled
  };
}
