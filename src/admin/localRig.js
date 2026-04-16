// ============================================
// Local Rig System — localStorage-based
// No Supabase needed! Everything works offline.
// ============================================

const STORAGE_KEY = 'prodraw_rig';

/**
 * Rig data structure:
 * {
 *   tournament: {
 *     enabled: boolean,
 *     targetWinner: string,
 *     triggerOnDraw: number,
 *     currentDrawCount: number,
 *   },
 *   spinner: {
 *     enabled: boolean,
 *     targetWinner: string,
 *     triggerOnSpin: number,
 *     currentSpinCount: number,
 *   },
 *   roundRobin: {
 *     enabled: boolean,
 *     group1: string[],           // names forced into Group 1
 *     group2: string[],           // names forced into Group 2
 *     triggerOnDraw: number,
 *     currentDrawCount: number,
 *   }
 * }
 */

function getDefaultState() {
  return {
    tournament: {
      enabled: false,
      targetWinner: '',
      triggerOnDraw: 5,
      currentDrawCount: 0,
    },
    spinner: {
      enabled: false,
      targetWinner: '',
      triggerOnSpin: 5,
      currentSpinCount: 0,
    },
    roundRobin: {
      enabled: false,
      group1: [],
      group2: [],
      triggerOnDraw: 1,
      currentDrawCount: 0,
    }
  };
}

export function getRigState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();
    const parsed = JSON.parse(raw);
    // Ensure roundRobin exists (backward compat)
    if (!parsed.roundRobin) {
      parsed.roundRobin = getDefaultState().roundRobin;
    }
    return parsed;
  } catch {
    return getDefaultState();
  }
}

function saveRigState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ── Tournament Rig ──

export function setTournamentRig(targetWinner, triggerOnDraw) {
  const state = getRigState();
  state.tournament.enabled = true;
  state.tournament.targetWinner = targetWinner;
  state.tournament.triggerOnDraw = triggerOnDraw;
  saveRigState(state);
}

export function clearTournamentRig() {
  const state = getRigState();
  state.tournament.enabled = false;
  state.tournament.targetWinner = '';
  state.tournament.currentDrawCount = 0;
  saveRigState(state);
}

export function setTournamentCounter(count) {
  const state = getRigState();
  state.tournament.currentDrawCount = count;
  saveRigState(state);
}

/**
 * Called every time the user clicks "Generate" on tournament.
 * Returns the targetWinner if this draw should be rigged, or null if normal.
 */
export function checkTournamentRig() {
  const state = getRigState();
  if (!state.tournament.enabled || !state.tournament.targetWinner) return null;

  // Increment draw counter
  state.tournament.currentDrawCount += 1;
  saveRigState(state);

  // Check if this draw matches the trigger
  if (state.tournament.currentDrawCount >= state.tournament.triggerOnDraw) {
    // Reset counter after triggering
    state.tournament.currentDrawCount = 0;
    saveRigState(state);
    return state.tournament.targetWinner;
  }

  return null;
}

// ── Spinner Rig ──

export function setSpinnerRig(targetWinner, triggerOnSpin) {
  const state = getRigState();
  state.spinner.enabled = true;
  state.spinner.targetWinner = targetWinner;
  state.spinner.triggerOnSpin = triggerOnSpin;
  saveRigState(state);
}

export function clearSpinnerRig() {
  const state = getRigState();
  state.spinner.enabled = false;
  state.spinner.targetWinner = '';
  state.spinner.currentSpinCount = 0;
  saveRigState(state);
}

export function setSpinnerCounter(count) {
  const state = getRigState();
  state.spinner.currentSpinCount = count;
  saveRigState(state);
}

/**
 * Called every time the user clicks "Spin".
 * Returns the targetWinner if this spin should be rigged, or null if normal.
 */
export function checkSpinnerRig() {
  const state = getRigState();
  if (!state.spinner.enabled || !state.spinner.targetWinner) return null;

  // Increment spin counter
  state.spinner.currentSpinCount += 1;
  saveRigState(state);

  // Check if this spin matches the trigger
  if (state.spinner.currentSpinCount >= state.spinner.triggerOnSpin) {
    // Reset counter after triggering
    state.spinner.currentSpinCount = 0;
    saveRigState(state);
    return state.spinner.targetWinner;
  }

  return null;
}

// ── Round Robin Rig ──

export function setRoundRobinRig(group1, group2, triggerOnDraw) {
  const state = getRigState();
  state.roundRobin.enabled = true;
  state.roundRobin.group1 = group1;
  state.roundRobin.group2 = group2;
  state.roundRobin.triggerOnDraw = triggerOnDraw;
  saveRigState(state);
}

export function clearRoundRobinRig() {
  const state = getRigState();
  state.roundRobin.enabled = false;
  state.roundRobin.group1 = [];
  state.roundRobin.group2 = [];
  state.roundRobin.currentDrawCount = 0;
  saveRigState(state);
}

export function setRoundRobinCounter(count) {
  const state = getRigState();
  state.roundRobin.currentDrawCount = count;
  saveRigState(state);
}

/**
 * Called every time the user clicks "Generate" on Round Robin.
 * Returns { group1, group2 } if this draw should be rigged, or null if normal.
 */
export function checkRoundRobinRig() {
  const state = getRigState();
  if (!state.roundRobin.enabled) return null;
  if (state.roundRobin.group1.length === 0 && state.roundRobin.group2.length === 0) return null;

  // Increment draw counter
  state.roundRobin.currentDrawCount += 1;
  saveRigState(state);

  // Check if this draw matches the trigger
  if (state.roundRobin.currentDrawCount >= state.roundRobin.triggerOnDraw) {
    // Reset counter after triggering
    state.roundRobin.currentDrawCount = 0;
    saveRigState(state);
    return {
      group1: state.roundRobin.group1,
      group2: state.roundRobin.group2
    };
  }

  return null;
}

// ── Quick Helpers ──

export function getTournamentDrawCount() {
  return getRigState().tournament.currentDrawCount;
}

export function getSpinnerSpinCount() {
  return getRigState().spinner.currentSpinCount;
}

export function getRoundRobinDrawCount() {
  return getRigState().roundRobin.currentDrawCount;
}
