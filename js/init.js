// =============================================
// INICIALIZACIÓN v3
// =============================================
function init() {
  loadCategories();
  loadPlayerNames();
  loadLastConfig();
  loadScores();
  loadNightStats();

  createParticles();
  setupRippleEffects();
  setupKeyboardShortcuts();
  setupRevealGestures();

  showScreen('home');
  updateDebugState();
}

// =============================================
// TYPEWRITER EFFECT
// =============================================
function typeText(element, text, speed = 40) {
  return new Promise(resolve => {
    element.textContent = '';
    let i = 0;
    const cursor = document.createElement('span');
    cursor.textContent = '│';
    cursor.style.animation = 'cursorBlink 0.5s step-end infinite';
    element.appendChild(cursor);

    function type() {
      if (i < text.length) {
        element.insertBefore(
          document.createTextNode(text[i]),
          cursor
        );
        i++;
        setTimeout(type, speed);
      } else {
        setTimeout(() => {
          cursor.remove();
          resolve();
        }, 500);
      }
    }
    type();
  });
}

// =============================================
// REVEAL GESTURES — SWIPE + TAP (UNA SOLA VEZ)
// =============================================
let revealGesturesSetup = false;

function setupRevealGestures() {
  if (revealGesturesSetup) return;
  revealGesturesSetup = true;

  const revealScreen = document.getElementById('screen-reveal');
  if (!revealScreen) return;

  let touchStartX = 0;
  let touchStartY = 0;
  let isDragging = false;

  revealScreen.addEventListener('touchstart', (e) => {
    if (!state.cardFlipped || state.isTransitioning) return;
    const card = document.getElementById('reveal-card-waiting');
    if (!card || !card.contains(e.target)) return;

    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isDragging = true;
    card.style.transition = 'none';
  }, { passive: true });

  revealScreen.addEventListener('touchmove', (e) => {
    if (!isDragging || !state.cardFlipped || state.isTransitioning) return;
    const card = document.getElementById('reveal-card-waiting');
    if (!card) return;

    const deltaX = e.touches[0].clientX - touchStartX;
    const deltaY = e.touches[0].clientY - touchStartY;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      const rotate = deltaX * 0.1;
      card.style.transform = `translateX(${deltaX}px) rotate(${rotate}deg)`;
      card.style.opacity = Math.max(0.3, 1 - Math.abs(deltaX) / 300);
    }
  }, { passive: true });

  revealScreen.addEventListener('touchend', (e) => {
    if (!isDragging || !state.cardFlipped || state.isTransitioning) return;
    isDragging = false;

    const card = document.getElementById('reveal-card-waiting');
    if (!card) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX;

    if (Math.abs(deltaX) > 60) {
      // Swipe suficiente
      const direction = deltaX > 0 ? 1 : -1;
      card.style.transition = 'transform 0.3s cubic-bezier(0.55,0,1,0.45), opacity 0.3s ease';
      card.style.transform = `translateX(${direction * 120}%) rotate(${direction * 15}deg)`;
      card.style.opacity = '0';
      setTimeout(() => {
        card.style.transition = '';
        card.style.transform = '';
        card.style.opacity = '';
        hideCardAndNext();
      }, 350);
    } else {
      // No llegó al threshold
      card.style.transition = 'transform 0.3s cubic-bezier(0.17,0.67,0.21,1.27), opacity 0.2s ease';
      card.style.transform = '';
      card.style.opacity = '';
    }
  }, { passive: true });

  // Tap en el fondo (fuera de la carta) = ocultar
  revealScreen.addEventListener('click', (e) => {
    if (!state.cardFlipped || state.isTransitioning) return;
    const card = document.getElementById('reveal-card-waiting');
    if (!card) return;
    if (!card.contains(e.target)) {
      hideCardAndNext();
    }
  });
}

// =============================================
// PARTICLE SYSTEM
// =============================================
function createParticles() {
  const app = document.getElementById('app');
  if (!app) return;

  for (let i = 0; i < 5; i++) {
    const particle = document.createElement('div');
    particle.className = 'bg-particle';

    const size = 2 + Math.random() * 3;
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const px = -30 + Math.random() * 60;
    const py = -40 + Math.random() * 80;
    const duration = 8 + Math.random() * 6;
    const delay = Math.random() * 5;

    particle.style.cssText = `
      left: ${x}%;
      top: ${y}%;
      --size: ${size}px;
      --px: ${px}px;
      --py: ${py}px;
      --duration: ${duration}s;
      --delay: ${delay}s;
    `;

    app.appendChild(particle);
  }
}

// =============================================
// RIPPLE EFFECTS
// =============================================
function setupRippleEffects() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn, .player-count-btn, .category-btn, .rounds-btn, .mode-option, .player-select-card, .accordion-item');
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';

    btn.style.position = 'relative';
    btn.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  });
}

// =============================================
// KEYBOARD SHORTCUTS
// =============================================
function setupKeyboardShortcuts() {
  // Enter key para content manager
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && state.phase === 'content') {
      // Detectar en qué input estamos
      if (document.activeElement && document.activeElement.classList.contains('add-word-input')) {
        const btn = document.activeElement.parentElement.querySelector('.btn');
        if (btn) btn.click();
      }
    }

    // Backtick para debug
    if (e.key === '`' || e.key === 'F1' || e.key === '~') {
      e.preventDefault();
      toggleDebug();
    }
  });

  // Triple-tap para debug
  let debugTapCount = 0;
  let debugTapTimer = null;

  document.addEventListener('click', (e) => {
    if (e.clientY < 60) {
      debugTapCount++;
      if (debugTapTimer) clearTimeout(debugTapTimer);
      debugTapTimer = setTimeout(() => { debugTapCount = 0; }, 600);
      if (debugTapCount >= 3) {
        debugTapCount = 0;
        toggleDebug();
      }
    }
  });
}

// =============================================
// GUARDADO PERIÓDICO
// =============================================
setInterval(() => {
  saveScores();
  saveLastConfig();
}, 5000);

// =============================================
// PREVENCIÓN DE ERRORES
// =============================================
window.addEventListener('beforeunload', () => {
  clearDiscussionTimer();
  clearAscendingTimer();
});

document.body.addEventListener('touchmove', e => {
  const target = e.target.closest('.word-list-form, .bulk-textarea, .screen:not(.no-scroll)');
  if (!target) {
    const activeScreen = document.querySelector('.screen.active');
    if (activeScreen && activeScreen.classList.contains('no-scroll')) {
      e.preventDefault();
    }
  }
}, { passive: false });

document.addEventListener('gesturestart', e => e.preventDefault());

// =============================================
// ARRANCAR
// =============================================
document.addEventListener('DOMContentLoaded', init);