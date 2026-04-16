// ============================================
// Constants & Labels (English)
// ============================================

export const FORMATS = {
  GUGUR: 'gugur',
  SWISS: 'swiss',
  LIGA: 'liga'
};

export const FORMAT_INFO = {
  [FORMATS.GUGUR]: {
    name: 'Single Elimination',
    icon: '🏆',
    description: 'Lose once, you\'re out! Direct elimination format.',
    minParticipants: 4,
    maxParticipants: 64,
    color: '#42B4F4'
  },
  [FORMATS.SWISS]: {
    name: 'Swiss Stage',
    icon: '🔄',
    description: 'Play multiple rounds, ranked by W/L record.',
    minParticipants: 4,
    maxParticipants: 64,
    color: '#3347C0'
  },
  [FORMATS.LIGA]: {
    name: 'Round Robin',
    icon: '📊',
    description: 'Everyone plays everyone! Most points wins.',
    minParticipants: 3,
    maxParticipants: 16,
    color: '#F0A0D0'
  }
};

export const ROUND_NAMES = {
  1: 'Round 1',
  2: 'Round 2',
  3: 'Round 3',
  4: 'Round 4',
  5: 'Round 5',
  6: 'Round 6'
};

export function getRoundName(roundNum, totalRounds) {
  if (roundNum === totalRounds) return 'Final';
  if (roundNum === totalRounds - 1) return 'Semi Final';
  if (roundNum === totalRounds - 2) return 'Quarter Final';
  return ROUND_NAMES[roundNum] || `Round ${roundNum}`;
}

export const LOADING_DURATION = 2500; // ms — consistent loading time
export const ADMIN_PASSWORD = 'admin2024';
export const ADMIN_CLICK_COUNT = 5;
export const ADMIN_CLICK_TIMEOUT = 3000; // ms
