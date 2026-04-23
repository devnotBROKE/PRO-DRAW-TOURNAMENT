// ============================================
// Raffle Spinner Page
// ============================================
import { initWheel, setSegments, spinWheel, isWheelSpinning, getSegments } from '../engine/wheelEngine.js';
import { triggerCelebration } from '../effects/confetti.js';
import { showWinnerPopup } from '../effects/animations.js';
import { setLastSpinnerNames } from '../admin/secretPanel.js';
import { checkSpinnerRig } from '../admin/localRig.js';
import { checkSpinnerRigSupabase, isSupabaseReady } from '../lib/supabase.js';

let isInitialized = false;

export function initSpinner() {
  if (isInitialized) return;
  isInitialized = true;

  const canvas = document.getElementById('wheel-canvas');
  if (canvas) {
    initWheel(canvas);
    // Draw empty state
    setSegments([]);
  }

  // Update wheel button
  const updateBtn = document.getElementById('spinner-update-btn');
  if (updateBtn) {
    updateBtn.addEventListener('click', updateWheelFromInput);
  }

  // Spin button
  const spinBtn = document.getElementById('spinner-spin-btn');
  if (spinBtn) {
    spinBtn.addEventListener('click', handleSpin);
  }

  // Auto-update on textarea input with debounce
  const textarea = document.getElementById('spinner-names');
  if (textarea) {
    let debounce;
    textarea.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(updateWheelFromInput, 500);
    });
  }
}

function updateWheelFromInput() {
  const textarea = document.getElementById('spinner-names');
  if (!textarea) return;

  const names = textarea.value.split('\n').map(s => s.trim()).filter(s => s !== '');
  const segments = setSegments(names);
  
  // Store names for admin panel
  setLastSpinnerNames(names);
  
  // Update counter
  const counter = document.getElementById('spinner-count');
  if (counter) {
    counter.textContent = `${segments.length} participants`;
    counter.className = segments.length >= 2 
      ? 'text-sm font-medium text-green-400' 
      : 'text-sm font-medium text-red-400';
  }

  // Enable/disable spin button
  const spinBtn = document.getElementById('spinner-spin-btn');
  if (spinBtn) {
    spinBtn.disabled = segments.length < 2;
  }
}

async function handleSpin() {
  if (isWheelSpinning() || getSegments().length < 2) return;

  const spinBtn = document.getElementById('spinner-spin-btn');
  if (spinBtn) {
    spinBtn.disabled = true;
    spinBtn.textContent = '🎡 Spinning...';
  }

  const currentSegments = getSegments();
  let forcedWinner = null;

  // ══════ CHECK SUPABASE RIG (primary) ══════
  if (isSupabaseReady()) {
    try {
      const supabaseRig = await checkSpinnerRigSupabase();
      if (supabaseRig && supabaseRig.winner) {
        const exactSupabaseMatch = currentSegments.find(n => n.toLowerCase() === supabaseRig.winner.toLowerCase());
        if (exactSupabaseMatch) {
          forcedWinner = exactSupabaseMatch;
          console.log('[RIG] Spinner rig from Supabase:', forcedWinner);
        }
      }
    } catch (e) {
      console.warn('[Spinner] Supabase rig check failed, falling back to local');
    }
  }

  // ══════ CHECK LOCAL RIG (fallback) ══════
  if (!forcedWinner) {
    const localRigged = checkSpinnerRig();
    if (localRigged) {
      const exactLocalMatch = currentSegments.find(n => n.toLowerCase() === localRigged.toLowerCase());
      if (exactLocalMatch) {
        forcedWinner = exactLocalMatch;
        console.log('[RIG] Spinner rig from localStorage:', forcedWinner);
      }
    }
  }

  spinWheel((winner) => {
    // Winner!
    triggerCelebration();
    showWinnerPopup(winner);

    if (spinBtn) {
      spinBtn.disabled = false;
      spinBtn.textContent = '🎡 SPIN AGAIN!';
    }
  }, forcedWinner);
}

export function renderSpinnerHTML() {
  return `
    <div class="page" id="arisan">
      <div class="max-w-5xl mx-auto px-4 py-10">
        <div class="text-center mb-8 animate-fade-in-down">
          <h2 class="text-3xl md:text-4xl font-black mb-2">
            🎡 Raffle <span class="gradient-text">Spinner</span>
          </h2>
          <p class="text-gray-400">Enter participant names, spin the wheel, and see who's lucky!</p>
        </div>

        <div class="grid md:grid-cols-2 gap-8 items-start">
          <!-- Input Section -->
          <div class="card animate-fade-in-up">
            <div class="flex items-center justify-between mb-3">
              <label class="text-sm font-semibold text-gray-300">📝 Participant List</label>
              <span id="spinner-count" class="text-sm font-medium text-gray-500">0 participants</span>
            </div>
            <textarea 
              id="spinner-names" 
              class="input-field mb-4" 
              style="min-height: 220px;"
              placeholder="Enter names, one per line:&#10;&#10;Alice&#10;Bob&#10;Charlie&#10;Diana&#10;Eddie&#10;Fiona"
            ></textarea>
            <button id="spinner-update-btn" class="btn-secondary w-full mb-3">
              🔄 Update Spinner
            </button>
            <p class="text-xs text-gray-500 text-center">Minimum 2 names to spin the wheel</p>
          </div>

          <!-- Wheel Section -->
          <div class="card flex flex-col items-center animate-fade-in-up delay-200">
            <div class="wheel-wrapper mb-8">
              <div class="wheel-pointer"></div>
              <div class="wheel-canvas-wrap">
                <canvas id="wheel-canvas" width="300" height="300"></canvas>
              </div>
              <div class="wheel-center">🎱</div>
            </div>

            <button 
              id="spinner-spin-btn" 
              class="btn-generate animate-pulse-glow" 
              disabled
              style="max-width: 280px;"
            >
              🎡 SPIN!
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
