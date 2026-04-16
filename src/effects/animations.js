// ============================================
// Animation Helpers
// ============================================

export function showLoading(container, text = 'Building bracket...') {
  container.innerHTML = `
    <div class="loading-container">
      <div class="loading-dots">
        <span></span><span></span><span></span>
      </div>
      <div class="loading-text">${text}</div>
    </div>
  `;
}

export function showWinnerPopup(winnerName, onClose) {
  const overlay = document.createElement('div');
  overlay.className = 'winner-overlay';
  overlay.innerHTML = `
    <div class="winner-card">
      <div class="trophy">🎉</div>
      <div class="winner-name">${winnerName}</div>
      <div class="winner-subtitle">Congratulations! You're the winner!</div>
      <button class="btn-primary mt-6" id="close-winner-popup">Close</button>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.id === 'close-winner-popup') {
      overlay.remove();
      if (onClose) onClose();
    }
  });

  // Auto-close after 5s
  setTimeout(() => {
    if (overlay.parentNode) overlay.remove();
  }, 8000);
}

export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
