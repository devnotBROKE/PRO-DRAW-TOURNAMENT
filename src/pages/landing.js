// ============================================
// Landing Page
// ============================================
import { showPage } from '../lib/router.js';

export function initLanding() {
  // Already rendered in HTML shell
}

export function renderLandingHTML() {
  return `
    <div class="page active" id="landing">
      <!-- Hero -->
      <section class="relative overflow-hidden">
        <div class="gradient-mesh absolute inset-0"></div>
        
        <!-- Floating decorative elements -->
        <div class="absolute top-20 left-10 text-6xl opacity-10 animate-float">🎱</div>
        <div class="absolute top-40 right-20 text-5xl opacity-10 animate-float delay-300">🏆</div>
        <div class="absolute bottom-20 left-1/4 text-4xl opacity-10 animate-float delay-500">🎡</div>
        
        <div class="relative max-w-5xl mx-auto px-4 py-20 md:py-32 text-center">
          <div class="animate-fade-in-down">
            <span class="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-sky-400/10 text-sky-300 border border-sky-400/20 mb-6">
              ✨ Trusted Platform #1
            </span>
          </div>
          
          <h1 class="hero-title text-4xl md:text-6xl lg:text-7xl font-black leading-tight mb-6 animate-fade-in-up">
            Manage Tournaments & Raffles
            <br>
            <span class="gradient-text">Hassle-Free.</span>
          </h1>
          
          <p class="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 animate-fade-in-up delay-200">
            The fairest and most responsive generator platform for your community. 
            From raffles to pool tournaments, everything done in seconds.
          </p>
          
          <div class="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-300">
            <button onclick="window.__showPage('arisan')" class="btn-primary text-lg px-8 py-4 rounded-xl">
              🎡 Try Raffle Spinner
            </button>
            <button onclick="window.__showPage('tournament')" class="btn-secondary text-lg px-8 py-4 rounded-xl">
              🏆 Create Tournament
            </button>
          </div>
        </div>
      </section>

      <!-- Feature Cards -->
      <section class="max-w-5xl mx-auto px-4 pb-20">
        <div class="grid md:grid-cols-2 gap-6">
          <!-- Raffle Card -->
          <div class="card card-feature group" onclick="window.__showPage('arisan')">
            <div class="relative z-10">
              <div class="text-5xl mb-5 group-hover:animate-float">🎡</div>
              <h3 class="text-2xl font-bold mb-3">Raffle Spinner</h3>
              <p class="text-gray-400 text-sm leading-relaxed mb-4">
                Randomly pick winners with a fun and exciting spinner animation. 
                Enter participant names, spin the wheel, and see who's lucky!
              </p>
              <div class="flex flex-wrap gap-2 mt-4">
                <span class="text-xs px-2 py-1 rounded-full bg-white/5 text-gray-400">🎯 100% Random</span>
                <span class="text-xs px-2 py-1 rounded-full bg-white/5 text-gray-400">🎨 Fun Animation</span>
                <span class="text-xs px-2 py-1 rounded-full bg-white/5 text-gray-400">📱 Responsive</span>
              </div>
              <div class="mt-5 text-sky-300 text-sm font-semibold group-hover:translate-x-2 transition-transform">
                Start Spinning →
              </div>
            </div>
          </div>

          <!-- Tournament Card -->
          <div class="card card-feature group" onclick="window.__showPage('tournament')">
            <div class="relative z-10">
              <div class="text-5xl mb-5 group-hover:animate-float">🏆</div>
              <h3 class="text-2xl font-bold mb-3">Tournament Pool</h3>
              <p class="text-gray-400 text-sm leading-relaxed mb-4">
                Create tournament brackets automatically with 3 formats: Single Elimination, Swiss Stage, 
                and Round Robin (League). Perfect for pool, futsal, or e-sports tournaments!
              </p>
              <div class="flex flex-wrap gap-2 mt-4">
                <span class="text-xs px-2 py-1 rounded-full bg-white/5 text-gray-400">🏆 3 Formats</span>
                <span class="text-xs px-2 py-1 rounded-full bg-white/5 text-gray-400">⚡ Instant</span>
                <span class="text-xs px-2 py-1 rounded-full bg-white/5 text-gray-400">🖥️ Desktop & Mobile</span>
              </div>
              <div class="mt-5 text-sky-300 text-sm font-semibold group-hover:translate-x-2 transition-transform">
                Create Tournament →
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- How It Works -->
      <section class="max-w-5xl mx-auto px-4 pb-20">
        <h2 class="text-3xl font-bold text-center mb-12">
          How It <span class="gradient-text">Works</span>
        </h2>
        <div class="grid md:grid-cols-3 gap-6">
          <div class="text-center animate-fade-in-up">
            <div class="w-16 h-16 rounded-2xl bg-sky-400/10 border border-sky-400/20 flex items-center justify-center text-2xl mx-auto mb-4">1️⃣</div>
            <h4 class="font-bold mb-2">Choose Feature</h4>
            <p class="text-gray-400 text-sm">Raffle Spinner or Tournament — pick what suits your needs.</p>
          </div>
          <div class="text-center animate-fade-in-up delay-200">
            <div class="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl mx-auto mb-4">2️⃣</div>
            <h4 class="font-bold mb-2">Input Participants</h4>
            <p class="text-gray-400 text-sm">Enter participant names one per line. Easy and fast.</p>
          </div>
          <div class="text-center animate-fade-in-up delay-400">
            <div class="w-16 h-16 rounded-2xl bg-pink-400/10 border border-pink-400/20 flex items-center justify-center text-2xl mx-auto mb-4">3️⃣</div>
            <h4 class="font-bold mb-2">Generate!</h4>
            <p class="text-gray-400 text-sm">Click the button and see results instantly with cool animations.</p>
          </div>
        </div>
      </section>
    </div>
  `;
}
