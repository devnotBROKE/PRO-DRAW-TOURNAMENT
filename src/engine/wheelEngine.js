// ============================================
// Wheel Engine — Canvas drawing + spin logic
// Supports rigged spins!
// ============================================

const COLORS = [
  '#3347C0', '#42B4F4', '#F0A0D0', '#2E8FD0', '#5B6AD4',
  '#6DC8F7', '#E880B8', '#1E56B0', '#7DD4FA', '#D478B0',
  '#4060D0', '#50C0F5', '#F5B8DC', '#386ECE', '#8B9AE0',
  '#38A8E8', '#E090C4', '#2A4CB0', '#64D0F8', '#C870A8'
];

let segments = [];
let canvas = null;
let ctx = null;
let currentRotation = 0;
let isSpinning = false;

export function initWheel(canvasElement) {
  canvas = canvasElement;
  ctx = canvas.getContext('2d');
}

export function setSegments(names) {
  segments = names.filter(n => n.trim() !== '');
  drawWheel(0);
  return segments;
}

export function getSegments() {
  return segments;
}

export function drawWheel(rotation = 0) {
  if (!ctx || segments.length === 0) {
    // Draw empty state
    if (ctx) {
      const size = canvas.width;
      const center = size / 2;
      ctx.clearRect(0, 0, size, size);
      ctx.beginPath();
      ctx.arc(center, center, center - 4, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.font = '14px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Enter names', center, center - 10);
      ctx.fillText('to start', center, center + 10);
    }
    return;
  }

  const size = canvas.width;
  const center = size / 2;
  const radius = center - 4;
  const sliceAngle = (2 * Math.PI) / segments.length;

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(center, center);
  ctx.rotate((rotation * Math.PI) / 180);

  segments.forEach((name, i) => {
    const startAngle = i * sliceAngle - Math.PI / 2;
    const endAngle = startAngle + sliceAngle;

    // Draw slice
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = COLORS[i % COLORS.length];
    ctx.fill();

    // Draw border
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw text
    ctx.save();
    ctx.rotate(startAngle + sliceAngle / 2);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${segments.length > 20 ? 9 : segments.length > 12 ? 11 : 13}px Outfit, sans-serif`;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 3;

    const maxLen = segments.length > 16 ? 6 : segments.length > 10 ? 8 : 12;
    const displayName = name.length > maxLen ? name.substring(0, maxLen) + '..' : name;
    ctx.fillText(displayName, radius - 12, 0);
    ctx.restore();
  });

  ctx.restore();
}

/**
 * Spin the wheel.
 * @param {Function} onComplete - callback(winner)
 * @param {string|null} forcedWinner - if set, the wheel will land on this name
 */
export function spinWheel(onComplete, forcedWinner = null) {
  if (isSpinning || segments.length < 2) return;
  isSpinning = true;

  let totalDegrees;
  const sliceAngle = 360 / segments.length;

  if (forcedWinner && segments.includes(forcedWinner)) {
    // ══════ RIGGED SPIN ══════
    // Calculate the exact rotation needed to land on the forced winner
    const winnerIndex = segments.indexOf(forcedWinner);
    
    // The pointer is at the top (0°). We need the wheel to stop so that
    // the winner's segment is under the pointer.
    // Winner segment center is at: winnerIndex * sliceAngle
    // We need: (360 - finalRotation % 360) lands in the winner's segment
    const targetDeg = winnerIndex * sliceAngle + sliceAngle / 2; // center of winner slice
    const stopAngle = (360 - targetDeg + 360) % 360;
    
    // Add some randomness within the slice so it doesn't always land dead center
    const jitter = (Math.random() - 0.5) * sliceAngle * 0.6; // ±30% of slice
    
    // Add 5-10 full spins for visual effect
    const fullSpins = 5 + Math.floor(Math.random() * 5);
    totalDegrees = fullSpins * 360 + stopAngle + jitter - (currentRotation % 360);
    if (totalDegrees < 1800) totalDegrees += 360 * 3; // ensure enough spins
    
    console.log('[RIG] Spinner rigged for:', forcedWinner);
  } else {
    // ══════ NORMAL SPIN ══════
    const extraDegrees = Math.floor(Math.random() * 360);
    totalDegrees = 1800 + Math.floor(Math.random() * 1800) + extraDegrees;
  }

  const targetRotation = currentRotation + totalDegrees;

  // Animate with requestAnimationFrame
  const startTime = performance.now();
  const duration = 4000; // 4 seconds
  const startRotation = currentRotation;

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function animate(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);
    
    currentRotation = startRotation + totalDegrees * eased;
    drawWheel(currentRotation);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      isSpinning = false;
      currentRotation = targetRotation % 360;

      // Calculate winner
      const normalizedDeg = (360 - (currentRotation % 360) + 360) % 360;
      const winnerIndex = Math.floor(normalizedDeg / sliceAngle);
      const winner = segments[winnerIndex] || segments[0];
      
      if (onComplete) onComplete(winner);
    }
  }

  requestAnimationFrame(animate);
}

export function isWheelSpinning() {
  return isSpinning;
}
