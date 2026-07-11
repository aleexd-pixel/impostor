// =============================================
// DEBUG PANEL v2
// =============================================

function toggleDebug() {
  state.debugOpen = !state.debugOpen;
  document.getElementById('debug-panel').classList.toggle('open', state.debugOpen);
  document.getElementById('debug-indicator').classList.toggle('visible', state.debugOpen);
  if (state.debugOpen) {
    updateDebugState();
    renderDebugDBStats();
  }
}

function updateDebugState() {
  if (!state.debugOpen) return;
  const el = document.getElementById('debug-state');
  if (!el) return;

  let html = '';

  html += debugRow('Fase', state.phase);
  html += debugRow('Ronda', state.currentRound + (state.config.rounds > 0 ? ' / ' + state.config.rounds : ' / ∞'));
  html += debugRow('Categoría', state.config.category || '—');
  html += debugRow('Palabra', state.secretWord || '—');
  html += debugRow('Impostores', state.impostorIndices.length > 0 ?
    state.impostorIndices.map(i => 'J' + (i + 1)).join(', ') : '—');
  html += debugRow('Timer', formatTime(state.timeRemaining));
  html += debugRow('Jugadores', state.config.playerCount);
  html += debugRow('Eliminados', state.eliminatedPlayers.length);

  if (state.players.length > 0) {
    html += '<div style="margin-top:6px">';
    state.players.forEach((p, i) => {
      const isImp = state.impostorIndices.includes(i);
      const isElim = state.eliminatedPlayers.includes(i);
      let role = isImp ? '💀 IMPOSTOR' : '✅ ' + state.secretWord;
      if (isElim) role = '❌ ELIMINADO';
      html += debugRow(p.name, role);
    });
    html += '</div>';
  }

  if (Object.keys(state.scores).length > 0) {
    html += '<div style="margin-top:6px"><span class="debug-label">Scores:</span></div>';
    Object.keys(state.scores).forEach(id => {
      html += debugRow('J' + (parseInt(id) + 1), state.scores[id] + ' pts');
    });
  }

  el.innerHTML = html;
}

function debugRow(label, value) {
  return `<div class="debug-row"><span class="debug-label">${label}</span><span class="debug-value">${value}</span></div>`;
}

function renderDebugDBStats() {
  const el = document.getElementById('debug-db-stats');
  if (!el) return;

  let html = '';
  const cats = getCategoryList();

  if (cats.length === 0) {
    html = '<p style="color:var(--text-muted);font-size:10px">Sin categorías</p>';
  } else {
    cats.forEach(cat => {
      html += debugRow(cat.emoji + ' ' + cat.name, cat.words.length + ' palabras');
    });
  }

  el.innerHTML = html;
}

function debugGoto(screen) {
  if (['reveal', 'discussion', 'select', 'result'].includes(screen)) {
    if (state.players.length === 0) {
      // Auto-init
      state.config.playerCount = 5;
      state.config.impostorCount = 1;
      state.currentRound = 1;
      state.impostorIndices = [2];
      state.secretWord = 'DEBUG';
      state.eliminatedPlayers = [];
      state.scores = {};

      for (let i = 0; i < 5; i++) {
        state.scores[i] = 0;
        state.players.push({
          id: i,
          name: 'Jugador ' + (i + 1),
          card: i === 2 ? { type: 'impostor' } : { type: 'normal', word: 'DEBUG' }
        });
      }
    }
  }

  if (screen === 'reveal') {
    state.currentRevealIndex = 0;
    state.cardFlipped = false;
    showRevealWaiting();
  }
  if (screen === 'select') renderSelectScreen();
  if (screen === 'result') {
    // Agregar resultado fake
    state.roundHistory.push({
      round: state.currentRound,
      word: state.secretWord,
      impostors: [...state.impostorIndices],
      eliminated: 0,
      caught: state.impostorIndices.includes(0),
      tie: false
    });
  }
  if (screen === 'gameover') {
    if (Object.keys(state.scores).length === 0) {
      for (let i = 0; i < state.config.playerCount; i++) {
        state.scores[i] = Math.floor(Math.random() * 10);
      }
    }
  }

  showScreen(screen);
  if (screen === 'result') showResult();
}

function debugRevealAll() {
  let msg = 'Cartas:\n';
  state.players.forEach((p, i) => {
    const isImp = state.impostorIndices.includes(i);
    const isElim = state.eliminatedPlayers.includes(i);
    let info = '';
    if (isElim) {
      info = '❌ ELIMINADO';
    } else if (isImp) {
      info = '💀 IMPOSTOR';
    } else {
      info = '✅ "' + p.card.word + '"';
    }
    msg += `J${i + 1}: ${info}\n`;
  });
  alert(msg);
}

function debugForceResult(type) {
  if (state.players.length === 0) {
    showToast('Inicializá un juego primero', 'error');
    return;
  }

  let elimIdx;
  if (type === 'caught') {
    elimIdx = state.impostorIndices[0];
  } else {
    do {
      elimIdx = Math.floor(Math.random() * state.config.playerCount);
    } while (state.impostorIndices.includes(elimIdx));
  }

  state.eliminatedPlayers.push(elimIdx);
  state.roundHistory.push({
    round: state.currentRound,
    word: state.secretWord,
    impostors: [...state.impostorIndices],
    eliminated: elimIdx,
    caught: state.impostorIndices.includes(elimIdx),
    tie: false
  });

  transitionTo(() => {
    showScreen('result');
    showResult();
  });
}

function debugSkipTimer() {
  if (state.config.timer > 0) {
    state.timeRemaining = 1;
    updateTimerDisplay();
  } else {
    endDiscussion();
  }
}

function debugAddScoreAll() {
  for (let i = 0; i < state.config.playerCount; i++) {
    state.scores[i] = (state.scores[i] || 0) + 5;
  }
  updateDebugState();
  showToast('+5 puntos a todos', 'success');
}

function debugResetGame() {
  clearDiscussionTimer();
  clearAscendingTimer();
  state.players = [];
  state.scores = {};
  state.roundHistory = [];
  state.currentRound = 1;
  state.secretWord = '';
  state.impostorIndices = [];
  state.eliminatedPlayers = [];
  showToast('Juego reseteado', 'success');
  showScreen('home');
}