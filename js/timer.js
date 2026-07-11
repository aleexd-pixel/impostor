// =============================================
// TIMER — FLIP DIGITS + BARRA DE PROGRESO
// =============================================
let lastTimerValue = -1;
let ascendingInterval = null;

function startDiscussionTimer() {
  clearDiscussionTimer();
  clearAscendingTimer();

  const aliveCount = getAlivePlayers().length;
  const totalPlayers = state.players.length;
  const hasEliminated = state.eliminatedPlayers.length > 0;

  document.getElementById('disc-round').textContent = state.currentRound;
  document.getElementById('disc-total-rounds').textContent = state.config.rounds === 0 ? '∞' : state.config.rounds;

  const catData = getCategoryById(state.secretCategory);
  document.getElementById('disc-category').textContent = catData ? catData.emoji + ' ' + catData.name : '';

  // Mostrar info de jugadores restantes
  const hintEl = document.querySelector('.discussion-hint');
  if (hintEl) {
    if (hasEliminated) {
      hintEl.textContent = `Quedan ${aliveCount} jugadores. Cada uno dice una palabra.`;
    } else {
      hintEl.textContent = 'Decí una palabra relacionada con el tema en tu turno';
    }
  }

  if (state.config.timer === 0) {
    // Modo ascendente
    state.timeRemaining = 0;
    lastTimerValue = -1;
    updateTimerDisplay();

    ascendingInterval = setInterval(() => {
      state.timeRemaining++;
      updateTimerDisplay();
    }, 1000);
  } else {
    // Modo countdown
    state.timeRemaining = state.config.timer;
    lastTimerValue = -1;
    updateTimerDisplay();

    state.timerInterval = setInterval(() => {
      state.timeRemaining--;
      updateTimerDisplay();

      if (state.timeRemaining <= 0) {
        clearDiscussionTimer();
        if (state.config.soundEnabled) AudioMgr.alarm();
        vibrate([200, 100, 200, 100, 200]);
      } else if (state.timeRemaining <= 10) {
        if (state.config.soundEnabled) AudioMgr.tick();
        vibrate(30);
      }
    }, 1000);
  }
}

function clearDiscussionTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

function clearAscendingTimer() {
  if (ascendingInterval) {
    clearInterval(ascendingInterval);
    ascendingInterval = null;
  }
}

function updateTimerDisplay() {
  const total = state.config.timer;
  const remaining = state.timeRemaining;
  const isCountdown = total > 0;
  const ratio = isCountdown ? remaining / total : 0;

  // Actualizar flip digits
  const time = Math.abs(remaining);
  const min = Math.floor(time / 60);
  const sec = time % 60;

  const m1 = Math.floor(min / 10);
  const m2 = min % 10;
  const s1 = Math.floor(sec / 10);
  const s2 = sec % 10;

  updateFlipDigit('timer-m1', m1);
  updateFlipDigit('timer-m2', m2);
  updateFlipDigit('timer-s1', s1);
  updateFlipDigit('timer-s2', s2);

  // Actualizar barra de progreso
  const barFill = document.getElementById('timer-bar-fill');
  if (barFill) {
    if (isCountdown) {
      barFill.style.width = (ratio * 100) + '%';
      barFill.className = 'timer-bar-fill';
      if (ratio <= 0.17) {
        barFill.classList.add('danger');
      } else if (ratio <= 0.5) {
        barFill.classList.add('warning');
      }
    } else {
      // Modo ascendente: barra siempre llena
      barFill.style.width = '100%';
      barFill.className = 'timer-bar-fill';
    }
  }

  // Actualizar label
  const label = document.querySelector('.timer-label');
  if (label) {
    label.textContent = isCountdown ? 'DISCUSIÓN' : 'CRONÓMETRO';
  }

  // Colores del texto
  const digits = document.querySelector('.timer-display');
  if (digits) {
    digits.className = 'timer-display';
    if (isCountdown) {
      if (ratio <= 0.17) {
        digits.classList.add('danger');
      } else if (ratio <= 0.5) {
        digits.classList.add('warning');
      }
    }
  }
}

function updateFlipDigit(id, newVal) {
  const el = document.getElementById(id);
  if (!el) return;
  const inner = el.querySelector('.flip-digit-inner');
  if (!inner) return;
  const currentVal = inner.textContent;
  if (currentVal == newVal) return;

  inner.classList.add('exiting');

  setTimeout(() => {
    inner.textContent = newVal;
    inner.classList.remove('exiting');
    inner.classList.add('entering');

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        inner.classList.remove('entering');
      });
    });
  }, 100);
}

function endDiscussion() {
  clearDiscussionTimer();
  clearAscendingTimer();
  releaseWakeLock();
  if (state.config.soundEnabled) AudioMgr.click();
  renderSelectScreen();
  showScreen('select');
}