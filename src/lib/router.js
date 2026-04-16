// ============================================
// SPA Router — Page switching with hash
// ============================================

const pages = {};
let currentPage = null;

export function registerPage(id, initFn) {
  pages[id] = { init: initFn, initialized: false };
}

export function showPage(pageId) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
  });

  // Show target page
  const el = document.getElementById(pageId);
  if (el) {
    el.classList.add('active');
    currentPage = pageId;
    
    // Init page if not yet
    if (pages[pageId] && !pages[pageId].initialized) {
      pages[pageId].init();
      pages[pageId].initialized = true;
    }
    
    // Update hash
    window.location.hash = pageId === 'landing' ? '' : pageId;
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Update nav active states
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.classList.toggle('text-amber-400', btn.dataset.nav === pageId);
    btn.classList.toggle('text-gray-400', btn.dataset.nav !== pageId);
  });
}

export function getCurrentPage() {
  return currentPage;
}

export function initRouter() {
  // Handle hash on load
  const hash = window.location.hash.replace('#', '');
  if (hash && document.getElementById(hash)) {
    showPage(hash);
  } else {
    showPage('landing');
  }

  // Handle browser back/forward
  window.addEventListener('hashchange', () => {
    const h = window.location.hash.replace('#', '');
    if (h && document.getElementById(h)) {
      showPage(h);
    } else {
      showPage('landing');
    }
  });
}
