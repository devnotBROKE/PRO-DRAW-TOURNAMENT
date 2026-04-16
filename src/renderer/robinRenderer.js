// ============================================
// Round Robin (Setengah Musim) Renderer
// — Tampilkan Group 1 dan Group 2
// ============================================

export function renderRoundRobin(data, container) {
  container.innerHTML = '';

  if (!data || !data.groups) {
    container.innerHTML = '<p class="text-center text-gray-500 italic py-8">No data available.</p>';
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'grid md:grid-cols-2 gap-6 animate-fade-in-up';

  data.groups.forEach((group, gi) => {
    const colors = gi === 0
      ? { bg: 'rgba(66,180,244,0.06)', border: 'rgba(66,180,244,0.25)', accent: '#42B4F4', badge: 'bg-sky-400/15 text-sky-300' }
      : { bg: 'rgba(240,160,208,0.06)', border: 'rgba(240,160,208,0.25)', accent: '#F0A0D0', badge: 'bg-pink-400/15 text-pink-300' };

    const el = document.createElement('div');
    el.className = 'rounded-xl border overflow-hidden';
    el.style.cssText = `background: ${colors.bg}; border-color: ${colors.border};`;
    el.style.animationDelay = `${gi * 150}ms`;

    el.innerHTML = `
      <div class="px-5 py-3 border-b" style="border-color: ${colors.border}; background: rgba(0,0,0,0.15);">
        <div class="flex items-center justify-between">
          <h4 class="font-bold text-lg" style="color: ${colors.accent};">${group.name}</h4>
          <span class="text-xs font-semibold px-2.5 py-1 rounded-full ${colors.badge}">${group.members.length} participants</span>
        </div>
      </div>
      <div class="p-4 space-y-2">
        ${group.members.map((name, i) => `
          <div class="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition">
            <span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style="background: ${colors.border}; color: ${colors.accent};">${i + 1}</span>
            <span class="font-medium text-sm text-white">${name}</span>
          </div>
        `).join('')}
      </div>
    `;

    wrapper.appendChild(el);
  });

  container.appendChild(wrapper);
}
