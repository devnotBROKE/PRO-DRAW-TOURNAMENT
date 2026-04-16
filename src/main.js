// ============================================
// Pro Draw & Tournament Suite — Main Entry
// ============================================
import './style.css';
import { showPage, registerPage, initRouter } from './lib/router.js';
import { initSupabase } from './lib/supabase.js';
import { renderLandingHTML, initLanding } from './pages/landing.js';
import { renderSpinnerHTML, initSpinner } from './pages/spinner.js';
import { renderTournamentHTML, initTournament } from './pages/tournament.js';
import { initSecretPanel } from './admin/secretPanel.js';

// Global function for onclick in HTML
window.__showPage = showPage;

function renderApp() {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <!-- Navbar -->
    <nav class="glass sticky top-0 z-50 border-b border-white/5">
      <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <h1 class="font-black text-xl cursor-pointer flex items-center gap-2" onclick="window.__showPage('landing')">
          <img src="/logo.png" alt="Pro Draw" class="h-16 w-auto">
        </h1>
        <div class="flex items-center gap-1">
          <button data-nav="arisan" onclick="window.__showPage('arisan')" 
            class="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition">
            🎡 Raffle
          </button>
          <button data-nav="tournament" onclick="window.__showPage('tournament')" 
            class="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition">
            🏆 Tournament
          </button>
        </div>
      </div>
    </nav>

    <!-- Pages -->
    ${renderLandingHTML()}
    ${renderSpinnerHTML()}
    ${renderTournamentHTML()}

    <!-- Footer -->
    <footer class="border-t border-white/5 mt-12">
      <div class="max-w-6xl mx-auto px-4 py-8 text-center">
        <p class="text-gray-500 text-sm mb-2">
          Pro Draw & Tournament Suite — Trusted Generator Platform
        </p>
        <p class="text-gray-600 text-xs">
          &copy; ${new Date().getFullYear()} Pro Draw. All rights reserved.
        </p>
        <p id="version-trigger" class="text-gray-700 text-xs mt-3 cursor-default select-none hover:text-gray-600 transition">
          v1.0.4
        </p>
      </div>
    </footer>
  `;
}

function init() {
  // 1. Init Supabase
  initSupabase();

  // 2. Render all pages
  renderApp();

  // 3. Register page initializers
  registerPage('arisan', initSpinner);
  registerPage('tournament', initTournament);
  registerPage('landing', initLanding);

  // 4. Init router (handles hash + shows initial page)
  initRouter();

  // 5. Init secret admin panel (easter egg)
  initSecretPanel();

  console.log('🎱 Pro Draw & Tournament Suite — Ready!');
}

// Boot
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
