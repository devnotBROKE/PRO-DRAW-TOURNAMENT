// ============================================
// Swiss Stage Renderer
// ============================================

export function renderSwiss(data, container) {
  container.innerHTML = '';

  if (!data || !data.rounds) {
    container.innerHTML = '<p class="text-center text-gray-500 italic py-8">No Swiss data available.</p>';
    return;
  }

  // Round pairings
  const roundsSection = document.createElement('div');
  roundsSection.className = 'mt-4';
  roundsSection.innerHTML = `
    <h4 class="text-lg font-bold mb-4 text-sky-300">🔄 Swiss Stage Match Schedule</h4>
    ${data.rounds.map((round, ri) => `
      <div class="swiss-round animate-fade-in-up" style="animation-delay: ${ri * 100}ms;">
        <div class="swiss-round-header">${round.name}</div>
        ${round.pairings.map((p, pi) => `
          <div class="swiss-match">
            <span class="font-medium text-white">${p.team1}</span>
            <span class="vs">VS</span>
            <span class="${p.team2 === 'BYE' ? 'text-gray-600 italic' : 'font-medium text-white'}">${p.team2}</span>
          </div>
        `).join('')}
      </div>
    `).join('')}
  `;
  container.appendChild(roundsSection);
}
