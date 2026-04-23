// ============================================
// Secret Admin Panel — 5-click easter egg
// Works 100% OFFLINE with localStorage!
// ============================================
import { ADMIN_PASSWORD, ADMIN_CLICK_COUNT, ADMIN_CLICK_TIMEOUT } from '../lib/constants.js';
import {
  getRigState,
  setTournamentRig, clearTournamentRig, setTournamentCounter,
  setSpinnerRig, clearSpinnerRig, setSpinnerCounter,
  setRoundRobinRig, clearRoundRobinRig, setRoundRobinCounter
} from './localRig.js';
import {
  adminSetFixed, adminSetCounter,
  adminSetRoundRobin, adminClearRoundRobin,
  adminSetSpinner, adminClearSpinner,
  isSupabaseReady
} from '../lib/supabase.js';
import { buildFixedBracket } from '../engine/singleElim.js';

let clickTimestamps = [];
let isAdminOpen = false;
let lastParticipants = [];
let lastSpinnerNames = [];

export function setLastParticipants(list) {
  lastParticipants = list;
}

export function getLastParticipants() {
  return lastParticipants;
}

export function setLastSpinnerNames(list) {
  lastSpinnerNames = list;
}

export function initSecretPanel() {
  const versionBtn = document.getElementById('version-trigger');
  if (!versionBtn) return;

  versionBtn.addEventListener('click', () => {
    const now = Date.now();
    clickTimestamps.push(now);
    clickTimestamps = clickTimestamps.filter(t => now - t < ADMIN_CLICK_TIMEOUT);

    if (clickTimestamps.length >= ADMIN_CLICK_COUNT) {
      clickTimestamps = [];
      showPasswordPrompt();
    }
  });
}

function showPasswordPrompt() {
  const overlay = document.createElement('div');
  overlay.className = 'admin-overlay';
  overlay.id = 'admin-password-overlay';
  overlay.innerHTML = `
    <div class="admin-panel" style="max-width: 380px;">
      <h3>🔐 Verification</h3>
      <input type="password" id="admin-pwd-input" class="input-field mb-4" placeholder="Enter password..." autofocus>
      <div class="flex gap-3">
        <button id="admin-pwd-submit" class="btn-primary flex-1">Login</button>
        <button id="admin-pwd-cancel" class="btn-secondary flex-1">Cancel</button>
      </div>
      <p id="admin-pwd-error" class="text-red-400 text-sm mt-3 hidden">Wrong password.</p>
    </div>
  `;
  document.body.appendChild(overlay);

  const input = document.getElementById('admin-pwd-input');
  const submitBtn = document.getElementById('admin-pwd-submit');
  const cancelBtn = document.getElementById('admin-pwd-cancel');
  const errorMsg = document.getElementById('admin-pwd-error');

  const tryLogin = () => {
    if (input.value === ADMIN_PASSWORD) {
      overlay.remove();
      openAdminPanel();
    } else {
      errorMsg.classList.remove('hidden');
      input.value = '';
      input.focus();
      setTimeout(() => errorMsg.classList.add('hidden'), 2000);
    }
  };

  submitBtn.addEventListener('click', tryLogin);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') tryLogin(); });
  cancelBtn.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  setTimeout(() => input.focus(), 100);
}

function openAdminPanel() {
  isAdminOpen = true;

  const state = getRigState();
  const tRig = state.tournament;
  const sRig = state.spinner;
  const rRig = state.roundRobin;

  const overlay = document.createElement('div');
  overlay.className = 'admin-overlay';
  overlay.id = 'admin-panel-overlay';

  // Build participant options for tournament
  const participantOptions = lastParticipants.length > 0
    ? lastParticipants.map(p => `<option value="${p}" ${p === tRig.targetWinner ? 'selected' : ''}>${p}</option>`).join('')
    : '<option value="">Enter participants first</option>';

  // Build spinner name options
  const spinnerOptions = lastSpinnerNames.length > 0
    ? lastSpinnerNames.map(p => `<option value="${p}" ${p === sRig.targetWinner ? 'selected' : ''}>${p}</option>`).join('')
    : '<option value="">Enter spinner names first</option>';

  const tCounterPercent = tRig.triggerOnDraw > 0 ? (tRig.currentDrawCount / tRig.triggerOnDraw) * 100 : 0;
  const sCounterPercent = sRig.triggerOnSpin > 0 ? (sRig.currentSpinCount / sRig.triggerOnSpin) * 100 : 0;

  overlay.innerHTML = `
    <div class="admin-panel" style="max-width: 520px; max-height: 90vh; overflow-y: auto;">
      <div class="flex items-center justify-between mb-6">
        <h3 class="mb-0">🔐 Admin Control Panel</h3>
        <button id="admin-close" class="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
      </div>

      <div class="bg-green-900/30 border border-green-700/50 rounded-lg p-4 mb-4 text-sm">
        <strong class="text-green-300">✅ Offline Mode — No Server Needed</strong>
        <p class="text-green-200/70 mt-1">All rig data is stored locally in this browser. Safe & undetectable.</p>
      </div>

      <!-- TAB SELECTOR -->
      <div class="flex gap-2 mb-6">
        <button id="tab-tournament" class="flex-1 px-4 py-2 rounded-lg text-sm font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 transition">🏆 Single Elim</button>
        <button id="tab-roundrobin" class="flex-1 px-4 py-2 rounded-lg text-sm font-bold bg-white/5 text-gray-400 border border-white/10 transition">📋 Round Robin</button>
        <button id="tab-spinner" class="flex-1 px-4 py-2 rounded-lg text-sm font-bold bg-white/5 text-gray-400 border border-white/10 transition">🎡 Spinner</button>
      </div>

      <!-- ═══════════ TOURNAMENT TAB ═══════════ -->
      <div id="panel-tournament">
        <div class="admin-counter mb-4">
          <div class="flex justify-between items-center text-sm">
            <span class="text-gray-400">Draw Counter</span>
            <span class="font-bold text-lg text-sky-300">${tRig.currentDrawCount} / ${tRig.triggerOnDraw}</span>
          </div>
          <div class="counter-bar">
            <div class="counter-fill" style="width: ${tCounterPercent}%"></div>
          </div>
          <p class="text-xs text-gray-500 mt-2">Draw #${tRig.triggerOnDraw} = fixed winner activated</p>
        </div>

        <div class="mb-4">
          <div class="flex justify-between text-sm mb-1">
            <span class="text-gray-400">Status:</span>
            <span class="${tRig.enabled ? 'text-green-400' : 'text-red-400'}">${tRig.enabled ? '✅ RIG ACTIVE' : '❌ Not Active'}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-400">Target Winner:</span>
            <span class="text-sky-300 font-medium">${tRig.targetWinner || 'Not set'}</span>
          </div>
        </div>

        <hr class="border-white/10 my-4">

        <div class="mb-4">
          <label class="block text-sm font-medium mb-2 text-gray-300">🏆 Select Team That Must Win:</label>
          <select id="admin-t-winner" class="input-field">
            <option value="">-- Select team --</option>
            ${participantOptions}
          </select>
          <p class="text-xs text-gray-500 mt-1">💡 Enter tournament participants first, then open this panel</p>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label class="block text-xs font-medium mb-1 text-gray-400">Trigger on Draw #</label>
            <input type="number" id="admin-t-trigger" class="input-field" min="1" max="99" value="${tRig.triggerOnDraw}" placeholder="e.g. 5">
          </div>
          <div>
            <label class="block text-xs font-medium mb-1 text-gray-400">Current Counter</label>
            <input type="number" id="admin-t-counter" class="input-field" min="0" max="99" value="${tRig.currentDrawCount}">
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <button id="admin-t-save" class="btn-primary w-full">💾 Activate Tournament Rig</button>
          <div class="grid grid-cols-2 gap-2">
            <button id="admin-t-quick" class="btn-secondary text-amber-400 border-amber-500/30 hover:bg-amber-500/10">⚡ Set Counter to max-1</button>
            <button id="admin-t-clear" class="btn-secondary text-red-400 border-red-500/30 hover:bg-red-500/10">🗑️ Clear Rig</button>
          </div>
        </div>
      </div>

      <!-- ═══════════ ROUND ROBIN TAB ═══════════ -->
      <div id="panel-roundrobin" style="display: none;">
        <div class="admin-counter mb-4">
          <div class="flex justify-between items-center text-sm">
            <span class="text-gray-400">Draw Counter</span>
            <span class="font-bold text-lg text-purple-300">${rRig.currentDrawCount} / ${rRig.triggerOnDraw}</span>
          </div>
          <div class="counter-bar">
            <div class="counter-fill" style="width: ${rRig.triggerOnDraw > 0 ? (rRig.currentDrawCount / rRig.triggerOnDraw) * 100 : 0}%; background: linear-gradient(90deg, #A855F7, #D946EF);"></div>
          </div>
          <p class="text-xs text-gray-500 mt-2">Draw #${rRig.triggerOnDraw} = fixed groups activated</p>
        </div>

        <div class="mb-4">
          <div class="flex justify-between text-sm mb-1">
            <span class="text-gray-400">Status:</span>
            <span class="${rRig.enabled ? 'text-green-400' : 'text-red-400'}">${rRig.enabled ? '✅ RIG ACTIVE' : '❌ Not Active'}</span>
          </div>
        </div>

        <hr class="border-white/10 my-4">

        <div class="mb-4">
          <label class="block text-sm font-medium mb-1 text-gray-300">Grup 1 (pisahkan dengan koma):</label>
          <input type="text" id="admin-r-g1" class="input-field mb-3" placeholder="A, B, C" value="${rRig.group1.join(', ')}">
          
          <label class="block text-sm font-medium mb-1 text-gray-300">Grup 2 (pisahkan dengan koma):</label>
          <input type="text" id="admin-r-g2" class="input-field" placeholder="D, E, F" value="${rRig.group2.join(', ')}">
        </div>

        <div class="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label class="block text-xs font-medium mb-1 text-gray-400">Trigger on Draw #</label>
            <input type="number" id="admin-r-trigger" class="input-field" min="1" max="99" value="${rRig.triggerOnDraw}" placeholder="e.g. 5">
          </div>
          <div>
            <label class="block text-xs font-medium mb-1 text-gray-400">Current Counter</label>
            <input type="number" id="admin-r-counter" class="input-field" min="0" max="99" value="${rRig.currentDrawCount}">
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <button id="admin-r-save" class="btn-primary w-full" style="background: linear-gradient(135deg, #A855F7, #D946EF);">💾 Activate Round Robin Rig</button>
          <div class="grid grid-cols-2 gap-2">
            <button id="admin-r-quick" class="btn-secondary text-amber-400 border-amber-500/30 hover:bg-amber-500/10">⚡ Set Counter to max-1</button>
            <button id="admin-r-clear" class="btn-secondary text-red-400 border-red-500/30 hover:bg-red-500/10">🗑️ Clear Rig</button>
          </div>
        </div>
      </div>

      <!-- ═══════════ SPINNER TAB ═══════════ -->
      <div id="panel-spinner" style="display: none;">
        <div class="admin-counter mb-4">
          <div class="flex justify-between items-center text-sm">
            <span class="text-gray-400">Spin Counter</span>
            <span class="font-bold text-lg text-pink-300">${sRig.currentSpinCount} / ${sRig.triggerOnSpin}</span>
          </div>
          <div class="counter-bar">
            <div class="counter-fill" style="width: ${sCounterPercent}%; background: linear-gradient(90deg, #F0A0D0, #E060A0);"></div>
          </div>
          <p class="text-xs text-gray-500 mt-2">Spin #${sRig.triggerOnSpin} = fixed winner activated</p>
        </div>

        <div class="mb-4">
          <div class="flex justify-between text-sm mb-1">
            <span class="text-gray-400">Status:</span>
            <span class="${sRig.enabled ? 'text-green-400' : 'text-red-400'}">${sRig.enabled ? '✅ RIG ACTIVE' : '❌ Not Active'}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-400">Target Winner:</span>
            <span class="text-pink-300 font-medium">${sRig.targetWinner || 'Not set'}</span>
          </div>
        </div>

        <hr class="border-white/10 my-4">

        <div class="mb-4">
          <label class="block text-sm font-medium mb-2 text-gray-300">🎡 Select Name That Must Win:</label>
          <select id="admin-s-winner" class="input-field">
            <option value="">-- Select name --</option>
            ${spinnerOptions}
          </select>
          <p class="text-xs text-gray-500 mt-1">💡 Enter spinner names first, then open this panel</p>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label class="block text-xs font-medium mb-1 text-gray-400">Trigger on Spin #</label>
            <input type="number" id="admin-s-trigger" class="input-field" min="1" max="99" value="${sRig.triggerOnSpin}" placeholder="e.g. 5">
          </div>
          <div>
            <label class="block text-xs font-medium mb-1 text-gray-400">Current Counter</label>
            <input type="number" id="admin-s-counter" class="input-field" min="0" max="99" value="${sRig.currentSpinCount}">
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <button id="admin-s-save" class="btn-primary w-full" style="background: linear-gradient(135deg, #F0A0D0, #E060A0);">💾 Activate Spinner Rig</button>
          <div class="grid grid-cols-2 gap-2">
            <button id="admin-s-quick" class="btn-secondary text-amber-400 border-amber-500/30 hover:bg-amber-500/10">⚡ Set Counter to max-1</button>
            <button id="admin-s-clear" class="btn-secondary text-red-400 border-red-500/30 hover:bg-red-500/10">🗑️ Clear Rig</button>
          </div>
        </div>
      </div>

      <p id="admin-status" class="text-xs text-center mt-4 text-gray-500"></p>
    </div>
  `;

  document.body.appendChild(overlay);

  // ── Tab switching ──
  const tabTournament = document.getElementById('tab-tournament');
  const tabRoundRobin = document.getElementById('tab-roundrobin');
  const tabSpinner = document.getElementById('tab-spinner');
  
  const panelTournament = document.getElementById('panel-tournament');
  const panelRoundRobin = document.getElementById('panel-roundrobin');
  const panelSpinner = document.getElementById('panel-spinner');

  const navInactive = 'flex-1 px-4 py-2 rounded-lg text-sm font-bold bg-white/5 text-gray-400 border border-white/10 transition';

  tabTournament.addEventListener('click', () => {
    tabTournament.className = 'flex-1 px-4 py-2 rounded-lg text-sm font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 transition';
    tabRoundRobin.className = navInactive;
    tabSpinner.className = navInactive;
    panelTournament.style.display = '';
    panelRoundRobin.style.display = 'none';
    panelSpinner.style.display = 'none';
  });

  tabRoundRobin.addEventListener('click', () => {
    tabRoundRobin.className = 'flex-1 px-4 py-2 rounded-lg text-sm font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 transition';
    tabTournament.className = navInactive;
    tabSpinner.className = navInactive;
    panelRoundRobin.style.display = '';
    panelTournament.style.display = 'none';
    panelSpinner.style.display = 'none';
  });

  tabSpinner.addEventListener('click', () => {
    tabSpinner.className = 'flex-1 px-4 py-2 rounded-lg text-sm font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 transition';
    tabTournament.className = navInactive;
    tabRoundRobin.className = navInactive;
    panelSpinner.style.display = '';
    panelTournament.style.display = 'none';
    panelRoundRobin.style.display = 'none';
  });

  // ── Close ──
  document.getElementById('admin-close').addEventListener('click', () => {
    overlay.remove();
    isAdminOpen = false;
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
      isAdminOpen = false;
    }
  });

  const statusEl = document.getElementById('admin-status');
  const showStatus = (msg, isError = false) => {
    statusEl.textContent = msg;
    statusEl.className = `text-xs text-center mt-4 ${isError ? 'text-red-400' : 'text-green-400'}`;
    setTimeout(() => { statusEl.textContent = ''; }, 3000);
  };

  // ═══════════ TOURNAMENT ACTIONS ═══════════

  // Save tournament rig
  document.getElementById('admin-t-save').addEventListener('click', async () => {
    const winner = document.getElementById('admin-t-winner').value;
    const trigger = parseInt(document.getElementById('admin-t-trigger').value);

    if (!winner) {
      showStatus('⚠️ Select a team first!', true);
      return;
    }
    if (isNaN(trigger) || trigger < 1) {
      showStatus('⚠️ Trigger must be >= 1!', true);
      return;
    }

    setTournamentRig(winner, trigger);
    
    // Sync to Supabase
    if (isSupabaseReady()) {
      const p = getLastParticipants();
      if (p.length > 0) {
        const bracket = buildFixedBracket(p, winner);
        await adminSetFixed(bracket, winner);
      } else {
        showStatus('⚠️ Teams list empty, please open Tournament page first so it registers the teams!', true);
        return;
      }
    }
    
    showStatus(`✅ Tournament rig active! "${winner}" will win on draw #${trigger} (Synced)`);
  });

  // Quick set counter to trigger-1
  document.getElementById('admin-t-quick').addEventListener('click', async () => {
    const trigger = parseInt(document.getElementById('admin-t-trigger').value) || 5;
    const quickVal = Math.max(0, trigger - 1);
    setTournamentCounter(quickVal);
    document.getElementById('admin-t-counter').value = quickVal;
    
    if (isSupabaseReady()) await adminSetCounter(quickVal);
    
    showStatus(`⚡ Counter set to ${quickVal}. NEXT draw = EXECUTE!`);
  });

  // Clear tournament rig
  document.getElementById('admin-t-clear').addEventListener('click', async () => {
    clearTournamentRig();
    document.getElementById('admin-t-winner').value = '';
    document.getElementById('admin-t-counter').value = 0;
    
    // Clear in supabase
    if (isSupabaseReady()) {
      await adminSetFixed(null, null);
      await adminSetCounter(0);
    }
    
    showStatus('🗑️ Tournament rig cleared.');
  });

  // ═══════════ ROUND ROBIN ACTIONS ═══════════

  document.getElementById('admin-r-save').addEventListener('click', async () => {
    const g1 = document.getElementById('admin-r-g1').value.split(',').map(s=>s.trim()).filter(s=>s!=='');
    const g2 = document.getElementById('admin-r-g2').value.split(',').map(s=>s.trim()).filter(s=>s!=='');
    const trigger = parseInt(document.getElementById('admin-r-trigger').value);

    if (g1.length === 0 && g2.length === 0) {
      showStatus('⚠️ Group 1 and 2 cannot be empty!', true);
      return;
    }
    if (isNaN(trigger) || trigger < 1) {
      showStatus('⚠️ Trigger must be >= 1!', true);
      return;
    }

    setRoundRobinRig(g1, g2, trigger);
    
    if (isSupabaseReady()) {
      await adminSetRoundRobin(g1, g2, trigger);
    }
    
    showStatus(`✅ Round Robin rig active on draw #${trigger} (Synced)`);
  });

  document.getElementById('admin-r-quick').addEventListener('click', async () => {
    // Note: Supabase doesn't have an RPC to manually set RR counter currently, so this only does local.
    const trigger = parseInt(document.getElementById('admin-r-trigger').value) || 5;
    const quickVal = Math.max(0, trigger - 1);
    setRoundRobinCounter(quickVal);
    document.getElementById('admin-r-counter').value = quickVal;
    showStatus(`⚡ Counter set to ${quickVal}. NEXT draw = EXECUTE! (Local only)`);
  });

  document.getElementById('admin-r-clear').addEventListener('click', async () => {
    clearRoundRobinRig();
    document.getElementById('admin-r-g1').value = '';
    document.getElementById('admin-r-g2').value = '';
    document.getElementById('admin-r-counter').value = 0;
    
    if (isSupabaseReady()) await adminClearRoundRobin();
    
    showStatus('🗑️ Round Robin rig cleared.');
  });

  // ═══════════ SPINNER ACTIONS ═══════════

  // Save spinner rig
  document.getElementById('admin-s-save').addEventListener('click', async () => {
    const winner = document.getElementById('admin-s-winner').value;
    const trigger = parseInt(document.getElementById('admin-s-trigger').value);

    if (!winner) {
      showStatus('⚠️ Select a name first!', true);
      return;
    }
    if (isNaN(trigger) || trigger < 1) {
      showStatus('⚠️ Trigger must be >= 1!', true);
      return;
    }

    setSpinnerRig(winner, trigger);
    if (isSupabaseReady()) await adminSetSpinner(winner, trigger);
    
    showStatus(`✅ Spinner rig active! "${winner}" will win on spin #${trigger} (Synced)`);
  });

  // Quick set spinner counter to trigger-1
  document.getElementById('admin-s-quick').addEventListener('click', async () => {
    // Note: Supabase doesn't have an RPC to manually set Spinner counter currently, so this only does local.
    const trigger = parseInt(document.getElementById('admin-s-trigger').value) || 5;
    const quickVal = Math.max(0, trigger - 1);
    setSpinnerCounter(quickVal);
    document.getElementById('admin-s-counter').value = quickVal;
    showStatus(`⚡ Spin counter set to ${quickVal}. NEXT spin = EXECUTE! (Local only)`);
  });

  // Clear spinner rig
  document.getElementById('admin-s-clear').addEventListener('click', async () => {
    clearSpinnerRig();
    document.getElementById('admin-s-winner').value = '';
    document.getElementById('admin-s-counter').value = 0;
    
    if (isSupabaseReady()) await adminClearSpinner();
    
    showStatus('🗑️ Spinner rig cleared.');
  });
}
