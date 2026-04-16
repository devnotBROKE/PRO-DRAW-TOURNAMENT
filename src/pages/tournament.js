// ============================================
// Tournament Generator Page
// ============================================
import { FORMATS, FORMAT_INFO, LOADING_DURATION } from '../lib/constants.js';
import { shuffle, buildSingleElimBracket } from '../engine/singleElim.js';
import { buildFixedBracket } from '../engine/singleElim.js';
import { buildSwissStage } from '../engine/swissStage.js';
import { buildRoundRobin } from '../engine/roundRobin.js';
import { renderBracket } from '../renderer/bracketRenderer.js';
import { renderSwiss } from '../renderer/swissRenderer.js';
import { renderRoundRobin } from '../renderer/robinRenderer.js';
import { triggerNormal, triggerCelebration } from '../effects/confetti.js';
import { showLoading, delay } from '../effects/animations.js';
import { setLastParticipants } from '../admin/secretPanel.js';
import { checkTournamentRig } from '../admin/localRig.js';
import { checkRoundRobinRigSupabase, isSupabaseReady } from '../lib/supabase.js';

let selectedFormat = FORMATS.GUGUR;
let isGenerating = false;

export function initTournament() {
  // Format selector
  document.querySelectorAll('.format-card').forEach(card => {
    card.addEventListener('click', () => {
      selectedFormat = card.dataset.format;
      document.querySelectorAll('.format-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      updateFormatInfo();
      updatePreview();
    });
  });

  // Generate button
  const genBtn = document.getElementById('generate-btn');
  if (genBtn) {
    genBtn.addEventListener('click', handleGenerate);
  }

  // Textarea — live preview + validation
  const textarea = document.getElementById('tourney-teams');
  if (textarea) {
    textarea.addEventListener('input', () => {
      validateInput();
      updatePreview();
    });
  }

  // Initial state
  updateFormatInfo();
}

function updateFormatInfo() {
  const info = FORMAT_INFO[selectedFormat];
  const limitsEl = document.getElementById('participant-limits');
  if (limitsEl) {
    limitsEl.textContent = `Min: ${info.minParticipants} — Max: ${info.maxParticipants} participants`;
  }
  validateInput();
}

function getParticipantNames() {
  const textarea = document.getElementById('tourney-teams');
  if (!textarea) return [];
  return textarea.value.split('\n').map(s => s.trim()).filter(s => s !== '');
}

function validateInput() {
  const genBtn = document.getElementById('generate-btn');
  const countEl = document.getElementById('team-count');
  
  if (!genBtn) return;

  const names = getParticipantNames();
  const info = FORMAT_INFO[selectedFormat];
  const isValid = names.length >= info.minParticipants && names.length <= info.maxParticipants;

  if (countEl) {
    countEl.textContent = `${names.length} participants`;
    countEl.className = isValid 
      ? 'text-sm font-semibold text-green-400' 
      : 'text-sm font-semibold text-red-400';
  }

  genBtn.disabled = !isValid || isGenerating;
}

function updatePreview() {
  const previewEl = document.getElementById('participant-preview');
  if (!previewEl) return;

  const names = getParticipantNames();

  if (names.length === 0) {
    previewEl.innerHTML = '<p class="text-gray-600 text-sm italic text-center py-4">Type participant names above to see preview...</p>';
    return;
  }

  const info = FORMAT_INFO[selectedFormat];
  const isValid = names.length >= info.minParticipants;

  let html = `
    <div class="flex items-center justify-between mb-3">
      <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Participant Preview</span>
      <span class="text-xs font-semibold ${isValid ? 'text-green-400' : 'text-sky-300'}">${names.length} people</span>
    </div>
    <div class="flex flex-wrap gap-2">
  `;

  names.forEach((name, i) => {
    const hue = (i * 137) % 360; // Golden angle for nice color spread
    html += `
      <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all animate-scale-in"
        style="background: hsla(${hue}, 60%, 50%, 0.1); border-color: hsla(${hue}, 60%, 50%, 0.25); color: hsl(${hue}, 60%, 70%); animation-delay: ${i * 30}ms;">
        <span class="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold" style="background: hsla(${hue}, 60%, 50%, 0.2);">${i + 1}</span>
        ${name}
      </span>
    `;
  });

  html += '</div>';

  if (!isValid) {
    html += `<p class="text-sky-300/70 text-xs mt-3">⚠️ Need at least ${info.minParticipants} participants for ${info.name} format</p>`;
  }

  previewEl.innerHTML = html;
}

async function handleGenerate() {
  if (isGenerating) return;
  isGenerating = true;

  const resultDiv = document.getElementById('tourney-result');
  const genBtn = document.getElementById('generate-btn');
  const tourneyName = document.getElementById('tourney-name')?.value || 'Tournament';

  const names = getParticipantNames();
  
  // Store participants for admin panel
  setLastParticipants(names);

  // Disable button
  genBtn.disabled = true;
  genBtn.innerHTML = '<span class="loading-spinner"></span> Shuffling...';

  // Show loading
  showLoading(resultDiv);

  // Start timer for consistent loading
  const startTime = Date.now();

  let bracket = null;
  let isCelebration = false;

  try {
    // ══════ RIG CHECK: Single Elimination ══════
    if (selectedFormat === FORMATS.GUGUR) {
      const riggedWinner = checkTournamentRig(); // localStorage-based
      
      if (riggedWinner && names.includes(riggedWinner)) {
        bracket = buildFixedBracket(names, riggedWinner);
        isCelebration = true;
        console.log('[RIG] Fixed bracket activated for:', riggedWinner);
      }
    }

    // ══════ RIG CHECK: Round Robin (Supabase) ══════
    if (!bracket && selectedFormat === FORMATS.LIGA) {
      let riggedGroups = null;

      // Try Supabase first
      if (isSupabaseReady()) {
        riggedGroups = await checkRoundRobinRigSupabase();
        if (riggedGroups) {
          console.log('[RIG] Round Robin rig from Supabase activated!');
        }
      }

      if (riggedGroups) {
        // Use fixed groups from Supabase
        bracket = {
          format: 'liga',
          groups: [
            { name: 'GRUP 1', members: riggedGroups.group1 },
            { name: 'GRUP 2', members: riggedGroups.group2 }
          ],
          participants: [...riggedGroups.group1, ...riggedGroups.group2]
        };
        isCelebration = true;
      }
    }

    // ══════ Normal flow ══════
    if (!bracket) {
      if (selectedFormat === FORMATS.GUGUR) {
        const shuffled = shuffle(names);
        bracket = buildSingleElimBracket(shuffled, false);
      } else if (selectedFormat === FORMATS.SWISS) {
        bracket = buildSwissStage(names);
      } else if (selectedFormat === FORMATS.LIGA) {
        bracket = buildRoundRobin(names);
      }
    }
  } catch (err) {
    console.warn('Generate error, falling back to local:', err);
    const shuffled = shuffle(names);
    bracket = buildSingleElimBracket(shuffled, false);
  }

  // Ensure consistent loading time
  const elapsed = Date.now() - startTime;
  if (elapsed < LOADING_DURATION) {
    await delay(LOADING_DURATION - elapsed);
  }

  // Render result
  resultDiv.innerHTML = '';

  // Tournament name header
  const header = document.createElement('div');
  header.className = 'text-center mb-4 animate-fade-in';
  header.innerHTML = `
    <h3 class="text-xl font-bold">${tourneyName}</h3>
    <p class="text-sm text-gray-400">${FORMAT_INFO[selectedFormat]?.name} — ${names.length} participants</p>
  `;
  resultDiv.appendChild(header);

  // Render based on format
  const bracketContainer = document.createElement('div');
  resultDiv.appendChild(bracketContainer);

  if (bracket) {
    if (selectedFormat === FORMATS.GUGUR || bracket.format === 'gugur') {
      renderBracket(bracket, bracketContainer);
    } else if (selectedFormat === FORMATS.SWISS || bracket.format === 'swiss') {
      renderSwiss(bracket, bracketContainer);
    } else if (selectedFormat === FORMATS.LIGA || bracket.format === 'liga') {
      renderRoundRobin(bracket, bracketContainer);
    }
  }

  // Confetti
  // Efek confetti disamakan agar tidak terlihat mencurigakan saat hasil rigged muncul
  triggerNormal();

  // Reset button
  isGenerating = false;
  genBtn.disabled = false;
  genBtn.innerHTML = '🎲 RANDOMIZE BRACKET';
  validateInput();
}

export function renderTournamentHTML() {
  return `
    <div class="page" id="tournament">
      <div class="max-w-5xl mx-auto px-4 py-10">
        <div class="text-center mb-8 animate-fade-in-down">
          <h2 class="text-3xl md:text-4xl font-black mb-2">
            🏆 Tournament <span class="gradient-text">Generator</span>
          </h2>
          <p class="text-gray-400">Create tournament brackets automatically in seconds!</p>
        </div>

        <div class="card animate-fade-in-up mb-8">
          <!-- Format Selector -->
          <label class="block text-sm font-semibold text-gray-300 mb-3">Choose Format:</label>
          <div class="format-grid grid grid-cols-3 gap-3 mb-6">
            ${Object.entries(FORMAT_INFO).map(([key, info]) => `
              <div class="format-card ${key === FORMATS.GUGUR ? 'selected' : ''}" data-format="${key}">
                <div class="text-3xl mb-2">${info.icon}</div>
                <div class="font-bold text-sm mb-1">${info.name}</div>
                <div class="text-xs text-gray-400 hidden md:block">${info.description}</div>
              </div>
            `).join('')}
          </div>

          <!-- Tournament Name -->
          <div class="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-semibold text-gray-300 mb-2">Tournament Name:</label>
              <input type="text" id="tourney-name" class="input-field" placeholder="e.g. Pool Tournament RT 07" value="Pool Tournament">
            </div>
            <div class="flex items-end">
              <div class="w-full">
                <div class="flex justify-between mb-2">
                  <label class="text-sm font-semibold text-gray-300">Participants:</label>
                  <span id="team-count" class="text-sm font-semibold text-gray-500">0 participants</span>
                </div>
                <p id="participant-limits" class="text-xs text-gray-500">Min: 4 — Max: 64 participants</p>
              </div>
            </div>
          </div>

          <!-- Participant Input -->
          <textarea 
            id="tourney-teams" 
            class="input-field mb-3" 
            style="min-height: 160px;"
            placeholder="Enter participant names, one per line:&#10;&#10;Tiger&#10;Eagle&#10;Leopard&#10;Hippo&#10;Wolf&#10;Crocodile"
          ></textarea>

          <!-- Live Preview -->
          <div id="participant-preview" class="rounded-xl bg-white/[0.02] border border-white/5 p-4 mb-4">
            <p class="text-gray-600 text-sm italic text-center py-4">Type participant names above to see preview...</p>
          </div>

          <!-- Generate Button -->
          <button id="generate-btn" class="btn-generate mt-2" disabled>
            🎲 RANDOMIZE BRACKET
          </button>
        </div>

        <!-- Result Area -->
        <div id="tourney-result" class="card" style="min-height: 100px;">
          <p class="text-center text-gray-500 italic py-8">
            Tournament bracket will appear here after you click "Randomize Bracket"...
          </p>
        </div>
      </div>
    </div>
  `;
}
