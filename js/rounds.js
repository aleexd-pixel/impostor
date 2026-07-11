// =============================================
// RONDAS ESPECIALES
// =============================================
const ROUND_TYPES = {
  NORMAL: 'normal',
  LIGHTNING: 'lightning',
  SILENCE: 'silence'
};

function getRoundType(roundNumber) {
  const config = state.config;

  // Ronda a mudas: primera ronda
  if (config.silenceRound === 'first' && roundNumber === 1) {
    return ROUND_TYPES.SILENCE;
  }

  // Ronda a mudas: aleatoria (no primera ni última)
  if (config.silenceRound === 'random' && roundNumber > 1 && roundNumber < config.rounds) {
    if (!state.silenceRoundUsed && Math.random() < 0.3) {
      state.silenceRoundUsed = true;
      return ROUND_TYPES.SILENCE;
    }
  }

  // Ronda relámpago: después de N rondas
  if (config.lightningEnabled && roundNumber === config.lightningAfterRound + 1 && !state.lightningUsed) {
    state.lightningUsed = true;
    return ROUND_TYPES.LIGHTNING;
  }

  return ROUND_TYPES.NORMAL;
}

// =============================================
// RONDA RELÁMPAGO — SECUENCIA COMPLETA
// =============================================
function startLightningRound() {
  dramaticTransition(() => {
    showScreen('lightning');
    renderLightningIntro();
  });
}

function renderLightningIntro() {
  const container = document.getElementById('screen-lightning');
  if (!container) return;

  container.innerHTML = `
    <div class="lightning-sequence" id="lightning-sequence">
      <div class="lightning-title" id="lightning-title"></div>
      <div class="lightning-subtitle" id="lightning-subtitle"></div>
    </div>
  `;

  const titleEl = document.getElementById('lightning-title');
  const subtitleEl = document.getElementById('lightning-subtitle');

  // Phase 1: Title appears letter by letter
  setTimeout(() => {
    animateLightningTitle(titleEl);
  }, 1500);

  // Phase 2: Subtitle
  setTimeout(() => {
    subtitleEl.textContent = '⚡ Una ronda rápida. Timer corto. Sin vueltas. ⚡';
    subtitleEl.style.animation = 'fadeUp 0.5s var(--spring-enter) forwards';
    if (state.config.soundEnabled) AudioMgr.thunder();
    vibrate([100, 50, 100]);
  }, 3000);

  // Phase 3: Show roulette
  setTimeout(() => {
    showLightningRoulette();
  }, 4500);
}

function animateLightningTitle(el) {
  const letters = 'RONDA'.split('');
  const goldLetters = 'RELÁMPAGO'.split('');

  el.innerHTML = '';

  // "RONDA" - green letters from random directions
  const rondaContainer = document.createElement('div');
  rondaContainer.style.display = 'flex';
  rondaContainer.style.justifyContent = 'center';
  rondaContainer.style.gap = '4px';
  rondaContainer.style.marginBottom = '8px';

  letters.forEach((letter, i) => {
    const span = document.createElement('span');
    span.textContent = letter;
    span.className = 'lightning-letter';
    span.style.color = 'var(--accent)';

    const directions = [
      'translateX(-40px) rotate(-15deg)',
      'translateY(-40px)',
      'translateX(40px) rotate(10deg)',
      'translateY(40px)',
      'translateX(-30px) rotate(-5deg)'
    ];

    span.style.transform = directions[i % directions.length];
    span.style.opacity = '0';
    rondaContainer.appendChild(span);

    setTimeout(() => {
      span.style.transition = 'all 0.5s var(--spring-bounce)';
      span.style.transform = 'translateX(0) rotate(0)';
      span.style.opacity = '1';
    }, i * 60);
  });

  el.appendChild(rondaContainer);

  // "RELÁMPAGO" - gold letters
  const relampagoContainer = document.createElement('div');
  relampagoContainer.style.display = 'flex';
  relampagoContainer.style.justifyContent = 'center';
  relampagoContainer.style.gap = '2px';

  goldLetters.forEach((letter, i) => {
    const span = document.createElement('span');
    span.textContent = letter;
    span.className = 'lightning-letter';
    span.style.color = 'var(--gold)';
    span.style.fontSize = '0.8em';

    span.style.transform = 'translateY(30px) scale(0.5)';
    span.style.opacity = '0';
    relampagoContainer.appendChild(span);

    setTimeout(() => {
      span.style.transition = 'all 0.4s var(--spring-bounce)';
      span.style.transform = 'translateY(0) scale(1)';
      span.style.opacity = '1';
    }, 500 + i * 40);
  });

  el.appendChild(relampagoContainer);
}

function showLightningRoulette() {
  const container = document.getElementById('screen-lightning');
  if (!container) return;

  const alivePlayers = state.players.filter(p => !state.eliminatedPlayers.includes(p.id));
  const playerNames = alivePlayers.map(p => p.name);

  container.innerHTML = `
    <div class="roulette-container" id="roulette-container">
      <div class="roulette-arrow">▼</div>
      <div class="roulette-wheel" id="roulette-wheel"></div>
    </div>
    <p class="roulette-instruction" id="roulette-instruction">Cualquiera puede tocar para girar</p>
  `;

  renderRoulette(playerNames);

  // Tap to spin
  const wheel = document.getElementById('roulette-wheel');
  wheel.addEventListener('click', () => {
    spinRoulette(playerNames, (winnerIndex) => {
      onRouletteWinner(alivePlayers[winnerIndex]);
    });
  }, { once: true });
}

function renderRoulette(playerNames) {
  const wheel = document.getElementById('roulette-wheel');
  if (!wheel) return;

  const colors = ['#22c55e', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#f97316', '#06b6d4', '#ec4899'];
  const segments = playerNames.length;
  const segmentAngle = 360 / segments;

  let svg = `<svg viewBox="0 0 200 200" class="roulette-svg">`;

  playerNames.forEach((name, i) => {
    const startAngle = (i * segmentAngle - 90) * (Math.PI / 180);
    const endAngle = ((i + 1) * segmentAngle - 90) * (Math.PI / 180);
    const x1 = 100 + 90 * Math.cos(startAngle);
    const y1 = 100 + 90 * Math.sin(startAngle);
    const x2 = 100 + 90 * Math.cos(endAngle);
    const y2 = 100 + 90 * Math.sin(endAngle);
    const largeArc = segmentAngle > 180 ? 1 : 0;

    const midAngle = ((i * segmentAngle + segmentAngle / 2) - 90) * (Math.PI / 180);
    const textX = 100 + 55 * Math.cos(midAngle);
    const textY = 100 + 55 * Math.sin(midAngle);
    const textRotation = (i * segmentAngle + segmentAngle / 2);

    svg += `
      <path d="M100,100 L${x1},${y1} A90,90 0 ${largeArc},1 ${x2},${y2} Z"
            fill="${colors[i % colors.length]}" fill-opacity="0.7" stroke="var(--bg-deep)" stroke-width="1"/>
      <text x="${textX}" y="${textY}" text-anchor="middle" dominant-baseline="middle"
            fill="white" font-size="10" font-family="var(--font-display)"
            transform="rotate(${textRotation}, ${textX}, ${textY})">
        ${name.substring(0, 8)}
      </text>
    `;
  });

  svg += `</svg>`;
  wheel.innerHTML = svg;
}

function spinRoulette(playerNames, callback) {
  const wheel = document.getElementById('roulette-wheel');
  const instruction = document.getElementById('roulette-instruction');
  if (!wheel || !instruction) return;

  instruction.style.opacity = '0';

  const segments = playerNames.length;
  const segmentAngle = 360 / segments;
  const targetIndex = Math.floor(Math.random() * segments);
  const targetAngle = 360 * 5 + (targetIndex * segmentAngle) + (segmentAngle / 2);

  const duration = 8000;
  const startTime = performance.now();
  let lastSegment = -1;

  function animate(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentAngle = targetAngle * eased;

    wheel.style.transform = `rotate(${currentAngle}deg)`;

    const currentSegment = Math.floor((currentAngle % 360) / segmentAngle);
    if (currentSegment !== lastSegment && progress > 0.3) {
      if (state.config.soundEnabled) AudioMgr.tick();
      lastSegment = currentSegment;
    }

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      if (state.config.soundEnabled) AudioMgr.gong();
      vibrate(150);
      setTimeout(() => callback(targetIndex), 1000);
    }
  }

  requestAnimationFrame(animate);
}

function onRouletteWinner(player) {
  state.lightningStarter = player.id;

  const container = document.getElementById('screen-lightning');
  if (!container) return;

  container.innerHTML = `
    <div class="lightning-winner">
      <p class="title-lg" style="color:var(--accent)">🎯 ${player.name}</p>
      <p class="subtitle">arranca la ronda relámpago</p>
      <p class="setup-hint" style="margin-top:16px">
        20 segundos por persona · 10 segundos de votación
      </p>
    </div>
  `;

  setTimeout(() => {
    startLightningReveal();
  }, 2500);
}

function startLightningReveal() {
  state.currentRevealIndex = 0;
  state.cardFlipped = false;
  state.isTransitioning = false;
  state.lightningRevealMode = true;
  state.lightningRevealTimer = null;

  showScreen('reveal');
  showLightningRevealNext();
}

function showLightningRevealNext() {
  const passplay = document.getElementById('reveal-passplay');
  const alivePlayers = state.players.filter(p => !state.eliminatedPlayers.includes(p.id));
  const currentPlayer = alivePlayers[state.currentRevealIndex];

  if (!currentPlayer) {
    startLightningDiscussion();
    return;
  }

  state.cardFlipped = false;

  passplay.innerHTML = `
    <div class="lightning-reveal-timer" id="lightning-reveal-timer">
      <div class="lightning-timer-bar" id="lightning-timer-bar"></div>
    </div>
    <div class="card-3d-container" id="reveal-card-waiting" onclick="flipCardReveal()">
      <div class="card-3d-inner" id="card-inner">
        <div class="card-face card-face-back">
          <div class="card-back-pattern"></div>
          <div class="card-back-icon">⚡</div>
          <div class="card-back-text">RELÁMPAGO</div>
        </div>
        <div class="card-face card-face-front" id="card-front">
          <span class="card-role-label" id="card-role-label"></span>
          <span class="card-word" id="card-word-text"></span>
          <span class="card-hint" id="card-hint-text"></span>
        </div>
      </div>
    </div>
    <p class="reveal-instruction" id="reveal-instruction">Tocá rápido para ver tu carta</p>
  `;

  // 5 second auto-hide timer
  let timeLeft = 5;
  const timerBar = document.getElementById('lightning-timer-bar');

  state.lightningRevealTimer = setInterval(() => {
    timeLeft--;
    if (timerBar) {
      timerBar.style.width = (timeLeft / 5 * 100) + '%';
      if (timeLeft <= 2) timerBar.classList.add('danger');
    }

    if (timeLeft <= 0) {
      clearInterval(state.lightningRevealTimer);
      autoHideLightningCard();
    }
  }, 1000);
}

function autoHideLightningCard() {
  state.currentRevealIndex++;
  showLightningRevealNext();
}

// =============================================
// RONDA A MUDAS
// =============================================
function startSilenceRound() {
  showScreen('silence');
  renderSilenceIntro();
}

function renderSilenceIntro() {
  const container = document.getElementById('screen-silence');
  if (!container) return;

  container.innerHTML = `
    <div class="silence-intro" id="silence-intro">
      <div class="silence-emoji">🤫</div>
      <h2 class="title-lg silence-title" id="silence-title"></h2>
      <div class="silence-instructions" id="silence-instructions"></div>
    </div>
  `;

  const titleEl = document.getElementById('silence-title');
  const instructionsEl = document.getElementById('silence-instructions');

  // Typewriter for title
  typeText(titleEl, 'RONDA A MUDAS', 80);

  // Instructions appear one by one
  const lines = [
    'Nadie habla.',
    'Solo mírense a los ojos.',
    'Después, votan en silencio.'
  ];

  lines.forEach((line, i) => {
    setTimeout(() => {
      const p = document.createElement('p');
      p.className = 'silence-line';
      p.textContent = line;
      p.style.animation = 'fadeUp 0.5s var(--spring-enter) forwards';
      instructionsEl.appendChild(p);
    }, 1500 + i * 500);
  });

  // Start silence timer after intro
  setTimeout(() => {
    startSilenceTimer();
  }, 5000);
}

function startSilenceTimer() {
  const container = document.getElementById('screen-silence');
  if (!container) return;

  const duration = state.config.silenceTimerDuration || 20;

  container.innerHTML = `
    <div class="silence-timer-container">
      <div class="silence-timer" id="silence-timer">
        <div class="silence-timer-fill" id="silence-timer-fill"></div>
        <span class="silence-timer-number" id="silence-timer-number">${duration}</span>
      </div>
    </div>
  `;

  let remaining = duration;
  const fill = document.getElementById('silence-timer-fill');
  const number = document.getElementById('silence-timer-number');
  const timer = document.getElementById('silence-timer');

  const interval = setInterval(() => {
    remaining--;
    if (number) number.textContent = remaining;

    if (fill) {
      fill.style.height = ((duration - remaining) / duration * 100) + '%';
    }

    if (remaining <= 5 && timer) {
      timer.classList.add('pulsing');
    }

    if (remaining <= 0) {
      clearInterval(interval);
      // Explode animation
      if (timer) {
        timer.style.animation = 'popIn 0.3s ease reverse forwards';
      }
      setTimeout(() => {
        if (state.config.soundEnabled) AudioMgr.reveal();
        vibrate(100);
        startSilenceVote();
      }, 300);
    }
  }, 1000);
}

function startSilenceVote() {
  renderSelectScreen();
  showScreen('select');
}

// =============================================
// MARCADOR DE LA NOCHE
// =============================================
let nightStats = {
  gamesPlayed: 0,
  totalRounds: 0,
  playerStats: {}
};

function loadNightStats() {
  try {
    const saved = sessionStorage.getItem('impostor_night');
    if (saved) nightStats = JSON.parse(saved);
  } catch (e) {}
}

function saveNightStats() {
  try {
    sessionStorage.setItem('impostor_night', JSON.stringify(nightStats));
  } catch (e) {}
}

function updateNightStats() {
  nightStats.gamesPlayed++;
  nightStats.totalRounds += state.roundHistory.length;

  state.players.forEach((player, i) => {
    const name = player.name;
    if (!nightStats.playerStats[name]) {
      nightStats.playerStats[name] = {
        timesPlayed: 0,
        timesImpostor: 0,
        impostorWins: 0,
        impostorLosses: 0,
        innocentWins: 0,
        innocentLosses: 0,
        totalScore: 0,
        timesEliminated: 0
      };
    }

    const stats = nightStats.playerStats[name];
    stats.timesPlayed++;
    stats.totalScore += state.scores[i] || 0;

    if (state.impostorIndices.includes(i)) {
      stats.timesImpostor++;
      const wasCaught = state.eliminatedPlayers.includes(i);
      if (wasCaught) {
        stats.impostorLosses++;
      } else {
        stats.impostorWins++;
      }
    } else {
      const wasEliminated = state.eliminatedPlayers.includes(i);
      if (wasEliminated) {
        stats.timesEliminated++;
      }
    }
  });

  saveNightStats();
}

function showNightStats() {
  showScreen('nightstats');
  renderNightStats();
}

function renderNightStats() {
  const container = document.getElementById('nightstats-body');
  if (!container) return;

  const stats = nightStats.playerStats;
  const sorted = Object.entries(stats).sort((a, b) => b[1].totalScore - a[1].totalScore);

  let bestImpostor = null;
  let bestImpostorRate = 0;
  let mostEliminated = null;
  let mostEliminatedCount = 0;

  Object.entries(stats).forEach(([name, s]) => {
    if (s.timesImpostor > 0) {
      const rate = s.impostorWins / s.timesImpostor;
      if (rate > bestImpostorRate) {
        bestImpostorRate = rate;
        bestImpostor = name;
      }
    }
    if (s.timesEliminated > mostEliminatedCount) {
      mostEliminatedCount = s.timesEliminated;
      mostEliminated = name;
    }
  });

  container.innerHTML = `
    <div class="nightstats-header">
      <p class="setup-hint">Partidas: ${nightStats.gamesPlayed} · Rondas: ${nightStats.totalRounds}</p>
    </div>

    ${bestImpostor ? `
      <div class="nightstats-award">
        <span class="nightstats-award-icon">🥇</span>
        <div>
          <p class="nightstats-award-title">MEJOR IMPOSTOR</p>
          <p class="nightstats-award-desc">${bestImpostor} — Se salvó ${stats[bestImpostor].impostorWins}/${stats[bestImpostor].timesImpostor} veces</p>
        </div>
      </div>
    ` : ''}

    ${mostEliminated ? `
      <div class="nightstats-award">
        <span class="nightstats-award-icon">💀</span>
        <div>
          <p class="nightstats-award-title">MÁS ELIMINADO</p>
          <p class="nightstats-award-desc">${mostEliminated} — Lo votaron ${mostEliminatedCount} veces</p>
        </div>
      </div>
    ` : ''}

    <div class="nightstats-ranking">
      <p class="label" style="margin-bottom:8px">RANKING</p>
      ${sorted.map(([name, s], i) => `
        <div class="nightstats-rank-row">
          <span class="nightstats-rank-pos">${i + 1}.</span>
          <span class="nightstats-rank-name">${name}</span>
          <span class="nightstats-rank-score">${s.totalScore} pts</span>
        </div>
      `).join('')}
    </div>

    <button class="btn btn-ghost btn-block" onclick="showScreen('home')">CERRAR</button>
  `;
}