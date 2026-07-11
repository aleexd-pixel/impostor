// =============================================
// NAVEGACIÓN — CROSSFADE SIMPLE
// =============================================
let previousScreen = null;

function showScreen(id) {
  if (state.config.soundEnabled) {
    AudioMgr.init();
    AudioMgr.click();
  }

  const previousPhase = state.phase;

  if (previousPhase === 'discussion') {
    clearDiscussionTimer();
    clearAscendingTimer();
    releaseWakeLock();
  }

  const currentScreen = document.querySelector('.screen.active');
  const newScreen = document.getElementById('screen-' + id);

  if (!newScreen || newScreen === currentScreen) return;

  state.phase = id;
  previousScreen = currentScreen;

  // Crossfade: nueva entra, vieja sale
  newScreen.classList.add('active');
  if (currentScreen) {
    currentScreen.classList.remove('active');
  }

  // Acciones al entrar
  if (id === 'setup') renderSetup();
  if (id === 'content') renderContentManager();
  if (id === 'discussion') {
    startDiscussionTimer();
    requestWakeLock();
  }
  if (id === 'gameover') renderGameOver();

  updateDebugState();
}

function transitionTo(callback) {
  callback();
}

function transitionToReveal(callback) {
  callback();
}

function transitionToDiscussion(callback) {
  callback();
}

function dramaticTransition(callback) {
  const flash = document.createElement('div');
  flash.style.cssText = 'position:fixed;inset:0;background:#000;z-index:999;opacity:0;transition:opacity 0.15s ease;pointer-events:none;';
  document.body.appendChild(flash);

  requestAnimationFrame(() => {
    flash.style.opacity = '1';
    setTimeout(() => {
      callback();
      setTimeout(() => {
        flash.style.opacity = '0';
        setTimeout(() => {
          if (flash.parentNode) flash.remove();
        }, 200);
      }, 50);
    }, 200);
  });
}

// =============================================
// WAKE LOCK
// =============================================
let wakeLock = null;

async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
    }
  } catch (e) { /* no soportado */ }
}

function releaseWakeLock() {
  if (wakeLock) {
    wakeLock.release().catch(() => {});
    wakeLock = null;
  }
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && state.phase === 'discussion') {
    requestWakeLock();
  }
});