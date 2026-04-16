// ============================================
// Bracket Renderer — Single Elimination Tree
// ============================================

export function renderBracket(bracket, container) {
  container.innerHTML = '';

  if (!bracket || !bracket.rounds || bracket.rounds.length === 0) {
    container.innerHTML = '<p class="text-center text-gray-500 italic py-8">No bracket data available.</p>';
    return;
  }

  // Only show champion banner if results are simulated (admin fixed bracket)
  if (bracket.champion) {
    const banner = document.createElement('div');
    banner.className = 'champion-banner';
    banner.innerHTML = `
      <div class="champion-icon">🏆</div>
      <div class="champion-label">CHAMPION</div>
      <div class="champion-name">${bracket.champion}</div>
    `;
    container.appendChild(banner);
  }

  // Desktop tree view
  const desktopView = document.createElement('div');
  desktopView.className = 'bracket-container mt-6';
  desktopView.innerHTML = renderDesktopTree(bracket);
  container.appendChild(desktopView);

  // Mobile column view
  const mobileView = document.createElement('div');
  mobileView.className = 'bracket-mobile mt-6';
  mobileView.innerHTML = renderMobileView(bracket);
  container.appendChild(mobileView);

  // Staggered animation
  requestAnimationFrame(() => {
    container.querySelectorAll('.match-card-wrapper').forEach((el, i) => {
      el.style.animationDelay = `${i * 80}ms`;
    });
  });
}

function renderDesktopTree(bracket) {
  const { rounds } = bracket;
  // Only show Round 1 if no results are simulated (draw-only mode)
  const hasResults = rounds.some(r => r.matches.some(m => m.winner && !m.isBye));
  const displayRounds = hasResults ? rounds : [rounds[0]];

  let html = '<div class="bracket-rounds">';

  displayRounds.forEach((round, rIdx) => {
    // Calculate spacing based on round level
    const gapMultiplier = Math.pow(2, rIdx);
    const matchGap = 16 * gapMultiplier;
    const topPad = (matchGap - 16) / 2;

    html += `
      <div class="bracket-round">
        <div class="bracket-round-title">${round.name}</div>
        <div class="bracket-matches" style="gap: ${matchGap}px; padding-top: ${topPad}px;">
    `;

    round.matches.forEach((match, mIdx) => {
      if (match.isBye && !match.team1 && !match.team2) {
        html += `<div class="match-card-wrapper" style="min-height: ${40 + matchGap}px;"></div>`;
        return;
      }

      // Skip matches where one team is BYE (auto-advance)
      if (!hasResults && (match.team1 === null || match.team2 === null)) {
        const realTeam = match.team1 || match.team2;
        if (realTeam) {
          html += `
            <div class="match-card-wrapper">
              <div class="match-card">
                <div class="match-team" style="padding: 10px 12px;">
                  <div><span class="seed">${mIdx * 2 + 1}</span> ${realTeam}</div>
                  <div class="text-xs text-gray-500 italic">BYE</div>
                </div>
              </div>
              ${rIdx < displayRounds.length - 1 ? '<div class="match-connector"></div>' : ''}
            </div>
          `;
        }
        return;
      }

      html += `
        <div class="match-card-wrapper">
          <div class="match-card">
            ${renderTeamRow(match.team1, match.score1, match.winner, mIdx * 2 + 1)}
            ${renderTeamRow(match.team2, match.score2, match.winner, mIdx * 2 + 2)}
          </div>
          ${rIdx < displayRounds.length - 1 ? '<div class="match-connector"></div>' : ''}
        </div>
      `;
    });

    html += '</div></div>';

    // Connector column between rounds
    if (rIdx < displayRounds.length - 1) {
      html += '<div style="min-width: 30px;"></div>';
    }
  });

  html += '</div>';
  return html;
}

function renderMobileView(bracket) {
  const { rounds } = bracket;
  const hasResults = rounds.some(r => r.matches.some(m => m.winner && !m.isBye));
  const displayRounds = hasResults ? rounds : [rounds[0]];

  let html = '';

  displayRounds.forEach(round => {
    html += `
      <div class="round-section">
        <div class="round-header">${round.name}</div>
    `;

    round.matches.forEach((match, i) => {
      if (match.isBye && !match.team1 && !match.team2) return;

      // Skip BYE matches in draw-only mode
      if (!hasResults && (match.team1 === null || match.team2 === null)) {
        const realTeam = match.team1 || match.team2;
        if (realTeam) {
          html += `
            <div class="match-card-wrapper" style="margin-bottom: 8px;">
              <div class="match-card" style="width: 100%;">
                <div class="match-team" style="padding: 10px 12px;">
                  <div><span class="seed">${i * 2 + 1}</span> ${realTeam}</div>
                  <div class="text-xs text-gray-500 italic">BYE</div>
                </div>
              </div>
            </div>
          `;
        }
        return;
      }

      html += `
        <div class="match-card-wrapper" style="margin-bottom: 8px;">
          <div class="match-card" style="width: 100%;">
            ${renderTeamRow(match.team1, match.score1, match.winner, i * 2 + 1)}
            ${renderTeamRow(match.team2, match.score2, match.winner, i * 2 + 2)}
          </div>
        </div>
      `;
    });

    html += '</div>';
  });

  return html;
}

function renderTeamRow(teamName, score, winner, seed) {
  if (!teamName) {
    return `
      <div class="match-team" style="color: rgba(255,255,255,0.15);">
        <div><span class="seed">${seed}</span> BYE</div>
        <div class="score">-</div>
      </div>
    `;
  }

  const isWinner = teamName === winner;
  const isLoser = winner && !isWinner;
  const hasResult = winner !== null && winner !== undefined;

  return `
    <div class="match-team ${hasResult && isWinner ? 'winner' : ''} ${hasResult && isLoser ? 'loser' : ''}">
      <div><span class="seed">${seed}</span> ${teamName}</div>
      <div class="score">${score !== null && score !== undefined ? score : '-'}</div>
    </div>
  `;
}
