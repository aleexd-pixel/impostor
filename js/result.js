// =============================================
// RESULT — LÓGICA CORRECTA DE EL IMPOSTOR
// =============================================

// =============================================
// UTILIDAD: JUGADORES VIVOS
// =============================================
function getAlivePlayers() {
  return state.players
    .map((p, i) => i)
    .filter(i => !state.eliminatedPlayers.includes(i));
}

function checkRoundOver() {
  const alive = getAlivePlayers();
  const aliveImpostors = alive.filter(i => state.impostorIndices.includes(i));
  const aliveInnocents = alive.filter(i => !state.impostorIndices.includes(i));

  if (aliveImpostors.length === 0) return 'innocents_win';
  if (aliveImpostors.length >= aliveInnocents.length) return 'impostors_win';
  if (alive.length <= 2 && aliveImpostors.length >= 1) return 'impostors_win';
  return null;
}

// =============================================
// SELECT ELIMINATED
// =============================================
function renderSelectScreen() {
  const grid = document.getElementById('player-select-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const alive = getAlivePlayers();

  alive.forEach((playerIdx) => {
    const player = state.players[playerIdx];
    const card = document.createElement('div');
    card.className = 'player-select-card';
    card.innerHTML = `
      <div class="player-avatar">${playerIdx + 1}</div>
      <span class="player-name">${player.name}</span>
    `;
    card.onclick = () => selectEliminated(playerIdx);
    grid.appendChild(card);
  });
}

function selectEliminated(index) {
  if (state.config.soundEnabled) AudioMgr.click();

  const cards = document.querySelectorAll('.player-select-card');
  cards.forEach((card) => {
    const playerIdx = parseInt(card.querySelector('.player-avatar').textContent) - 1;
    if (playerIdx === index) {
      card.style.borderColor = 'var(--accent)';
      card.style.boxShadow = '0 0 30px var(--accent-glow)';
    } else {
      card.style.opacity = '0.3';
      card.style.transform = 'scale(0.95)';
    }
  });

  setTimeout(() => {
    handleElimination(index);
  }, 500);
}

function handleElimination(eliminatedIndex) {
  state.eliminatedPlayers.push(eliminatedIndex);

  state.roundHistory.push({
    round: state.currentRound,
    word: state.secretWord,
    impostors: [...state.impostorIndices],
    eliminated: eliminatedIndex,
    caught: state.impostorIndices.includes(eliminatedIndex),
    tie: false
  });

  // Verificar si el juego terminó
  const result = checkRoundOver();

  if (result) {
    endGame(result);
  } else {
    // Hay más jugadores, mostrar resultado
    dramaticTransition(() => {
      showScreen('result');
      showResult();
    });
  }
}

function handleTie() {
  if (state.config.soundEnabled) AudioMgr.click();

  state.roundHistory.push({
    round: state.currentRound,
    word: state.secretWord,
    impostors: [...state.impostorIndices],
    eliminated: -1,
    caught: false,
    tie: true
  });

  // Empate: nadie es eliminado, volver a discusión
  showToast('🤝 Empate — Nadie eliminado', 'success');

  setTimeout(() => {
    showScreen('discussion');
    startDiscussionTimer();
  }, 1000);
}

// =============================================
// SHOW RESULT — COUNTDOWN 3-2-1
// =============================================
function showResult() {
  const container = document.getElementById('result-content');
  if (!container) return;

  document.body.classList.add('atmosphere-countdown');

  container.innerHTML = '<div class="countdown-number" id="result-countdown">3</div>';

  let countdown = 3;

  function animateCountdown(num) {
    const cd = document.getElementById('result-countdown');
    if (!cd) return;

    cd.textContent = num;
    cd.style.animation = 'none';
    cd.offsetHeight;
    cd.style.animation = 'countdown-pop 0.6s cubic-bezier(0.17,0.67,0.21,1.27)';

    if (state.config.soundEnabled) AudioMgr.countdown();
    vibrate(60 + (3 - num) * 40);

    if (num > 1) {
      setTimeout(() => animateCountdown(num - 1), 1000);
    } else {
      setTimeout(() => {
        document.body.classList.remove('atmosphere-countdown');
        revealFinalResult(container);
      }, 600);
    }
  }

  animateCountdown(3);
}

// =============================================
// REVEAL FINAL RESULT
// =============================================
function revealFinalResult(container) {
  const elimIdx = state.eliminatedPlayers[state.eliminatedPlayers.length - 1];
  const isImpostorEliminated = state.impostorIndices.includes(elimIdx);
  const eliminatedPlayer = state.players[elimIdx];
  const aliveCount = getAlivePlayers().length;

  let html = '';

  if (isImpostorEliminated) {
    // ENCONTRARON AL IMPOSTOR — JUEGO TERMINA
    html += '<p class="result-title result-title-win" style="animation: resultFadeIn 0.5s cubic-bezier(0.17,0.67,0.21,1.27) 0.2s both">🎉 ¡LO ENCONTRARON!</p>';
    html += `<div class="result-card caught" style="animation: resultFadeIn 0.5s cubic-bezier(0.17,0.67,0.21,1.27) 0.6s both">
      <p class="result-player-name">${eliminatedPlayer.name}</p>
      <p class="result-role" style="color: var(--accent)">💀 ERA EL IMPOSTOR</p>
      <p class="result-word-label">La palabra era:</p>
      <p class="result-word">${state.secretWord}</p>
    </div>`;
    html += '<p class="result-subtitle" style="animation: resultFadeIn 0.4s ease 1s both">Los inocentes ganan esta partida.</p>';
    html += '<button class="btn btn-gold btn-block" style="animation: resultFadeIn 0.4s cubic-bezier(0.17,0.67,0.21,1.27) 1.2s both; max-width:300px" onclick="showScreen(\'gameover\')">🏆 RESULTADOS FINALES</button>';
    html += '<button class="btn btn-ghost btn-block" style="animation: resultFadeIn 0.4s ease 1.4s both; max-width:300px" onclick="showScreen(\'setup\')">🔄 NUEVA PARTIDA</button>';

    if (state.config.soundEnabled) AudioMgr.victory();
    showConfettiExplosive();
    vibrate([100, 50, 100, 50, 200]);

  } else {
    // INOCENTE ELIMINADO — EL IMPOSTOR SIGUE OCULTO
    html += '<p class="result-title result-title-lose" style="animation: resultFadeIn 0.5s cubic-bezier(0.17,0.67,0.21,1.27) 0.2s both">❌ Era inocente</p>';
    html += `<div class="result-card innocent" style="animation: resultFadeIn 0.5s cubic-bezier(0.17,0.67,0.21,1.27) 0.6s both">
      <p class="result-player-name">${eliminatedPlayer.name}</p>
      <p class="result-role" style="color: var(--text-secondary)">✅ ERA INOCENTE</p>
      <p class="result-word-label">Quedan ${aliveCount} jugadores</p>
    </div>`;
    html += '<p class="result-subtitle" style="animation: resultFadeIn 0.4s ease 1s both">El impostor sigue entre ustedes.</p>';
    html += '<button class="btn btn-primary btn-block" style="animation: resultFadeIn 0.4s cubic-bezier(0.17,0.67,0.21,1.27) 1.2s both; max-width:300px" onclick="continueRound()">▶ CONTINUAR RONDA</button>';
    html += '<button class="btn btn-ghost btn-block" style="animation: resultFadeIn 0.4s ease 1.4s both; max-width:300px" onclick="showScreen(\'setup\')">🔄 NUEVA PARTIDA</button>';

    if (state.config.soundEnabled) AudioMgr.defeat();
    vibrate([200, 100, 200]);
    // NO confeti, NO revelar impostor, NO revelar palabra
  }

  container.innerHTML = html;
}

// =============================================
// CONTINUAR RONDA — VOLVER A DISCUSIÓN
// =============================================
function continueRound() {
  if (state.config.soundEnabled) AudioMgr.click();

  state.eliminatedIndex = -1;

  // Verificar si el juego terminó
  const result = checkRoundOver();
  if (result) {
    endGame(result);
    return;
  }

  // Volver a discusión con los jugadores que quedan
  showScreen('discussion');
  startDiscussionTimer();
}

// =============================================
// NEXT ROUND — NUEVA PARTIDA COMPLETA
// =============================================
function nextRound() {
  if (state.config.soundEnabled) AudioMgr.click();

  state.currentRound++;
  state.eliminatedPlayers = [];
  state.players = [];
  state.impostorIndices = [];
  state.secretWord = '';
  state.secretHint = '';
  state.secretCategory = '';
  state.currentRevealIndex = 0;
  state.cardFlipped = false;
  state.isTransitioning = false;

  startRound();
}

// =============================================
// GAME OVER
// =============================================
function endGame(winner) {
  state.gameWinner = winner;

  if (winner === 'impostors_win') {
    state.impostorIndices.forEach(idx => {
      if (!state.eliminatedPlayers.includes(idx)) {
        state.scores[idx] = (state.scores[idx] || 0) + 3;
      }
    });
  } else {
    state.players.forEach((p, i) => {
      if (!state.impostorIndices.includes(i) && !state.eliminatedPlayers.includes(i)) {
        state.scores[i] = (state.scores[i] || 0) + 2;
      }
    });
  }

  if (state.config.nightStatsEnabled) {
    updateNightStats();
  }

  dramaticTransition(() => {
    showScreen('gameover');
  });
}

function renderGameOver() {
  const sorted = Object.keys(state.scores)
    .map(id => ({ id: parseInt(id), score: state.scores[id] }))
    .sort((a, b) => b.score - a.score);

  const podium = document.getElementById('podium');
  if (!podium) return;
  podium.innerHTML = '';

  const medals = ['🥇', '🥈', '🥉'];
  const classes = ['first', 'second', 'third'];
  const order = sorted.length >= 3 ? [sorted[1], sorted[0], sorted[2]] : sorted;

  order.forEach((p) => {
    const place = document.createElement('div');
    const actualIdx = sorted.indexOf(p);
    place.className = 'podium-place ' + (classes[actualIdx] || '');

    const isImpostor = state.impostorIndices.includes(p.id);
    place.innerHTML = `
      <span class="podium-medal">${medals[actualIdx] || ''}</span>
      <span class="podium-name">${state.players[p.id].name}</span>
      <span class="podium-score">${p.score} pts</span>
      ${isImpostor ? '<span style="color:var(--accent);font-size:10px">💀 IMPOSTOR</span>' : ''}
    `;
    podium.appendChild(place);
  });

  const stats = document.getElementById('gameover-stats');
  if (!stats) return;
  let statsHtml = '';

  state.roundHistory.forEach(r => {
    const impNames = r.impostors.map(i => state.players[i].name).join(', ');
    const result = r.caught ? '✅ Atrapado' : (r.tie ? '🤝 Empate' : '💀 Se salvó');
    statsHtml += `
      <div class="stat-row">
        <span class="stat-label">Ronda ${r.round} — "${r.word}"</span>
        <span class="stat-value">${impNames} · ${result}</span>
      </div>
    `;
  });

  stats.innerHTML = statsHtml;

  const winnerEl = document.getElementById('gameover-winner');
  if (winnerEl) {
    if (state.gameWinner === 'innocents_win') {
      winnerEl.textContent = '🏆 ¡GANARON LOS INOCENTES!';
      winnerEl.style.color = 'var(--success)';
    } else {
      winnerEl.textContent = '💀 ¡GANARON LOS IMPOSTORES!';
      winnerEl.style.color = 'var(--accent)';
    }
  }

  showConfettiExplosive();
}