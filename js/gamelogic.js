// =============================================
// LÓGICA DEL JUEGO — MÚLTIPLES IMPOSTORES
// =============================================

function startGame() {
  const catId = state.config.category;

  if (catId === 'mixto') {
    const totalWords = Object.values(categories).reduce((sum, c) => sum + c.words.length, 0);
    if (totalWords < state.config.impostorCount + 1) {
      showToast('Necesitás al menos ' + (state.config.impostorCount + 1) + ' palabras en total', 'error');
      return;
    }
  } else {
    const cat = getCategoryById(catId);
    if (!cat || cat.words.length < state.config.impostorCount + 1) {
      showToast('Necesitás al menos ' + (state.config.impostorCount + 1) + ' palabras', 'error');
      return;
    }
  }

  state.currentRound = 1;
  state.roundHistory = [];
  state.scores = {};
  state.eliminatedPlayers = [];
  for (let i = 0; i < state.config.playerCount; i++) {
    state.scores[i] = 0;
  }

  startRound();
}

function startRound() {
  // Check for special round type
  const roundType = getRoundType(state.currentRound);
  state.currentRoundType = roundType;

  if (roundType === ROUND_TYPES.LIGHTNING) {
    startLightningRound();
    return;
  }

  if (roundType === ROUND_TYPES.SILENCE) {
    // Still need to set up players and cards
    setupRoundPlayers();
    startSilenceRound();
    return;
  }

  // Normal round
  setupRoundPlayers();
  startNormalRound();
}

function setupRoundPlayers() {
  const catId = state.config.category;

  // Seleccionar palabra
  let chosenWord, chosenHint, chosenCatId;

  if (catId === 'mixto') {
    const allWords = [];
    Object.values(categories).forEach(cat => {
      cat.words.forEach(w => {
        allWords.push({ word: w.word, hint: w.hint || '', catId: cat.id, catName: cat.name });
      });
    });

    const available = allWords.filter(w => {
      const used = state.usedWords[w.catId] || [];
      return !used.includes(w.word);
    });

    if (available.length === 0) {
      state.usedWords = {};
      return startRound();
    }

    const chosen = available[Math.floor(Math.random() * available.length)];
    chosenWord = chosen.word;
    chosenHint = chosen.hint;
    chosenCatId = chosen.catId;

    if (!state.usedWords[chosenCatId]) state.usedWords[chosenCatId] = [];
    state.usedWords[chosenCatId].push(chosenWord);
  } else {
    const cat = getCategoryById(catId);
    const available = cat.words.filter(w => {
      const used = state.usedWords[catId] || [];
      return !used.includes(w.id);
    });

    if (available.length === 0) {
      state.usedWords[catId] = [];
      return startRound();
    }

    const chosen = available[Math.floor(Math.random() * available.length)];
    chosenWord = chosen.word;
    chosenHint = chosen.hint || '';
    chosenCatId = catId;

    if (!state.usedWords[catId]) state.usedWords[catId] = [];
    state.usedWords[catId].push(chosen.id);
  }

  state.secretWord = chosenWord;
  state.secretHint = chosenHint;
  state.secretCategory = chosenCatId;

  // Elegir impostores
  const alivePlayers = [];
  for (let i = 0; i < state.config.playerCount; i++) {
    if (!state.eliminatedPlayers.includes(i)) {
      alivePlayers.push(i);
    }
  }

  state.impostorIndices = [];
  const shuffled = shuffleArray(alivePlayers);
  for (let i = 0; i < state.config.impostorCount; i++) {
    if (i < shuffled.length) {
      state.impostorIndices.push(shuffled[i]);
    }
  }

  // Preparar jugadores
  state.players = [];
  for (let i = 0; i < state.config.playerCount; i++) {
    const isImpostor = state.impostorIndices.includes(i);
    let cardContent;

    if (isImpostor) {
      // Impostor recibe la pista de la palabra elegida
      cardContent = { type: 'impostor', hint: chosenHint };

      // Si hay múltiples impostores y se conocen
      if (state.config.impostorsKnowEachOther && state.config.impostorCount > 1) {
        const others = state.impostorIndices
          .filter(idx => idx !== i)
          .map(idx => getPlayerName(idx));
        cardContent.complices = others;
      }
    } else {
      cardContent = { type: 'normal', word: state.secretWord };
    }

    state.players.push({
      id: i,
      name: getPlayerName(i),
      card: cardContent
    });
  }

  state.currentRevealIndex = 0;
  state.cardFlipped = false;
  state.isTransitioning = false;
}

function startNormalRound() {
  // Transición
  if (state.config.revealMode === 'pass_and_play') {
    showScreen('reveal');
    showRevealWaiting();
  } else {
    showScreen('reveal');
    showSimultaneousReveal();
  }
}

// =============================================
// REVEAL — PASS & PLAY
// =============================================
function showRevealWaiting() {
  const passplay = document.getElementById('reveal-passplay');

  const alivePlayers = state.players.filter((p) => !state.eliminatedPlayers.includes(p.id));
  const currentPlayer = alivePlayers[state.currentRevealIndex];

  if (!currentPlayer) {
    goToDiscussion();
    return;
  }

  // Reset state
  state.cardFlipped = false;
  state.isTransitioning = false;
  state.revealStep = 'name';

  passplay.innerHTML = `
    <p class="label">Pasale el celular a</p>
    <h2 class="title-lg text-gold reveal-player-name-type" id="reveal-player-name"></h2>
    <button class="btn btn-primary btn-lg btn-block" style="max-width:300px" onclick="confirmPlayerIdentity()">
      SOY ${currentPlayer.name.toUpperCase()}
    </button>
  `;

  // Typewriter effect
  const nameEl = document.getElementById('reveal-player-name');
  if (nameEl) {
    typeText(nameEl, currentPlayer.name, 40);
  }
}

function confirmPlayerIdentity() {
  if (state.config.soundEnabled) AudioMgr.click();

  const passplay = document.getElementById('reveal-passplay');

  // Show card - button has fixed space reserved (invisible until needed)
  passplay.innerHTML = `
    <div class="card-3d-container" id="reveal-card-waiting" onclick="flipCardReveal()">
      <div class="card-3d-inner" id="card-inner">
        <div class="card-face card-face-back">
          <div class="card-back-pattern"></div>
          <div class="card-back-icon">🎭</div>
          <div class="card-back-text">EL IMPOSTOR</div>
        </div>
        <div class="card-face card-face-front" id="card-front">
          <span class="card-role-label" id="card-role-label">Tu palabra</span>
          <span class="card-word" id="card-word-text"></span>
          <span class="card-hint" id="card-hint-text"></span>
        </div>
      </div>
    </div>
    <div class="reveal-bottom">
      <p class="reveal-instruction" id="reveal-instruction">Tocá la carta para ver tu rol</p>
      <button class="btn btn-primary btn-lg btn-block" id="btn-hide-card" style="opacity:0;pointer-events:none;max-width:300px" onclick="hideCardAndNext()">
        SIGUIENTE JUGADOR →
      </button>
      <p class="reveal-warning" id="reveal-warning" style="opacity:0">⚠️ ¡Que nadie más vea!</p>
    </div>
  `;

  state.revealStep = 'card';
  state.isTransitioning = false;
}

function flipCardReveal() {
  if (state.cardFlipped) return;
  state.cardFlipped = true;

  if (state.config.soundEnabled) AudioMgr.init();

  const cardInner = document.getElementById('card-inner');
  const cardFront = document.getElementById('card-front');
  const cardRoleLabel = document.getElementById('card-role-label');
  const cardWordText = document.getElementById('card-word-text');
  const cardHintText = document.getElementById('card-hint-text');
  const btnHide = document.getElementById('btn-hide-card');
  const warning = document.getElementById('reveal-warning');
  const instruction = document.getElementById('reveal-instruction');

  const alivePlayers = state.players.filter((p) => !state.eliminatedPlayers.includes(p.id));
  const player = alivePlayers[state.currentRevealIndex];
  const card = player.card;

  // Preparar contenido
  if (card.type === 'impostor') {
    cardFront.classList.add('impostor-card');
    cardRoleLabel.textContent = '';
    cardWordText.className = 'card-word-impostor';
    cardWordText.textContent = 'IMPOSTOR';

    // Mostrar pista según configuración
    if (state.config.hintsEnabled) {
      if (card.complices && card.complices.length > 0) {
        cardHintText.textContent = 'Tus cómplices: ' + card.complices.join(', ');
        cardHintText.style.display = 'block';
        cardHintText.style.color = 'var(--accent)';
      } else if (card.hint) {
        cardHintText.textContent = 'Pista: "' + card.hint + '"';
        cardHintText.style.display = 'block';
        cardHintText.style.color = 'var(--text-secondary)';
      } else {
        cardHintText.textContent = 'Sin pista disponible para esta palabra';
        cardHintText.style.display = 'block';
        cardHintText.style.color = 'var(--text-muted)';
      }
    } else {
      cardHintText.textContent = 'Escuchá a los demás e intentá no delatarte.';
      cardHintText.style.display = 'block';
      cardHintText.style.color = 'var(--text-muted)';
    }
  } else {
    cardFront.classList.remove('impostor-card');
    cardRoleLabel.textContent = 'Tu palabra secreta';
    cardWordText.className = 'card-word';
    cardWordText.textContent = card.word;
    cardHintText.style.display = 'none';
  }

  // Flip
  cardInner.style.transition = 'transform 0.7s var(--spring-card)';
  cardInner.classList.add('flipped');
  instruction.textContent = 'Memorizá y tocá OCULTAR';

  if (state.config.soundEnabled) AudioMgr.reveal();
  vibrate(50);

  // Efectos según rol
  setTimeout(() => {
    if (card.type === 'impostor') {
      cardFront.classList.add('glitch-effect');
      cardInner.classList.add('impostor-shake');
      vibrate([50, 30, 50]);
      setTimeout(() => {
        cardFront.classList.remove('glitch-effect');
        cardInner.classList.remove('impostor-shake');
        cardFront.classList.add('impostor-pulse');
      }, 400);
    } else {
      cardWordText.classList.add('animate-shimmer');
      setTimeout(() => cardWordText.classList.remove('animate-shimmer'), 2000);
    }
  }, 350);

  // Mostrar botón ocultar
  setTimeout(() => {
    btnHide.style.display = 'flex';
    btnHide.style.opacity = '1';
    btnHide.style.transition = 'opacity 0.3s var(--spring-enter)';
    warning.style.display = 'block';
  }, 800);
}

function hideCardAndNext() {
  // Guard: prevent double-tap
  if (state.isTransitioning) return;
  state.isTransitioning = true;

  if (state.config.soundEnabled) AudioMgr.click();

  const cardInner = document.getElementById('card-inner');
  const btnHide = document.getElementById('btn-hide-card');

  // Disable button immediately
  if (btnHide) {
    btnHide.disabled = true;
    btnHide.style.opacity = '0.5';
  }

  // Animate card out
  if (cardInner) {
    cardInner.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease';
    cardInner.style.transform = 'scale(0.8) translateY(-20px)';
    cardInner.style.opacity = '0';
  }

  state.currentRevealIndex++;

  const alivePlayers = state.players.filter((p) => !state.eliminatedPlayers.includes(p.id));

  setTimeout(() => {
    if (state.currentRevealIndex >= alivePlayers.length) {
      goToDiscussion();
    } else {
      showRevealWaiting();
    }
  }, 350);
}

function goToDiscussion() {
  transitionToDiscussion(() => showScreen('discussion'));
}

// =============================================
// REVEAL — SIMULTÁNEO
// =============================================
function showSimultaneousReveal() {
  const grid = document.getElementById('simultaneous-grid');
  if (!grid) return;

  const alivePlayers = state.players.filter((p) => !state.eliminatedPlayers.includes(p.id));

  grid.innerHTML = alivePlayers.map((p, i) => `
    <button class="btn btn-ghost simultaneous-player-btn" onclick="showSimultaneousCard(${i})">
      ${p.name}
    </button>
  `).join('');

  let timeLeft = 5;
  const timerEl = document.getElementById('simultaneous-timer');
  if (timerEl) timerEl.textContent = timeLeft;

  const interval = setInterval(() => {
    timeLeft--;
    if (timerEl) timerEl.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(interval);
      hideSimultaneousCards();
    }
  }, 1000);

  state.simultaneousTimer = interval;
}

function showSimultaneousCard(index) {
  const alivePlayers = state.players.filter((p) => !state.eliminatedPlayers.includes(p.id));
  const player = alivePlayers[index];
  if (!player) return;

  const modal = document.getElementById('simultaneous-modal');
  if (!modal) return;

  const card = player.card;
  let cardHtml = '';

  if (card.type === 'impostor') {
    cardHtml = `
      <div class="card-face-front impostor-card" style="position:relative;transform:none;border-radius:var(--radius-lg);padding:40px;text-align:center">
        <span class="card-word-impostor" style="font-size:32px">IMPOSTOR</span>
        ${card.complices ? `<p style="margin-top:12px;font-size:14px;color:var(--text-muted)">Cómplices: ${card.complices.join(', ')}</p>` : ''}
        ${card.hint ? `<p style="margin-top:8px;font-size:14px;color:var(--text-secondary)">Pista: ${card.hint}</p>` : '<p style="margin-top:8px;font-size:12px;color:var(--text-muted)">Sin pista</p>'}
      </div>
    `;
  } else {
    cardHtml = `
      <div class="card-face-front" style="position:relative;transform:none;border-radius:var(--radius-lg);padding:40px;text-align:center">
        <span class="card-role-label">Tu palabra secreta</span>
        <span class="card-word">${card.word}</span>
      </div>
    `;
  }

  modal.innerHTML = `
    <div class="simultaneous-card-content" onclick="hideSimultaneousCard()">
      ${cardHtml}
      <p style="margin-top:16px;font-size:12px;color:var(--text-muted)">Tocá para cerrar</p>
    </div>
  `;
  modal.classList.add('active');
}

function hideSimultaneousCard() {
  const modal = document.getElementById('simultaneous-modal');
  if (modal) modal.classList.remove('active');
}

function hideSimultaneousCards() {
  if (state.simultaneousTimer) {
    clearInterval(state.simultaneousTimer);
    state.simultaneousTimer = null;
  }
  hideSimultaneousCard();
  goToDiscussion();
}