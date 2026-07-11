// =============================================
// PLAY SCREEN — SIMPLIFICADO
// =============================================
function renderPlayScreen() {
  const container = document.getElementById('setup-accordion');
  if (!container) return;

  const cats = getCategoryList();
  const minWords = state.config.playerCount - state.config.impostorCount + 1;
  const summaryLine = getPlaySummary();

  container.innerHTML = `
    <!-- JUGADORES -->
    <div class="play-section">
      <p class="play-section-title">👥 JUGADORES</p>
      <div class="player-count-selector">
        <button class="count-btn" onclick="adjustPlayerCount(-1)" ${state.config.playerCount <= 4 ? 'disabled' : ''}>−</button>
        <span class="count-value">${state.config.playerCount}</span>
        <button class="count-btn" onclick="adjustPlayerCount(1)" ${state.config.playerCount >= 8 ? 'disabled' : ''}>+</button>
      </div>
      <button class="name-inputs-toggle" onclick="toggleNameInputs()">
        ${state.showNames ? 'Ocultar nombres ▾' : 'Personalizar nombres ▸'}
      </button>
      <div class="name-inputs-collapsed ${state.showNames ? 'open' : ''}">
        ${renderNameInputs()}
      </div>
    </div>

    <!-- CATEGORÍA -->
    <div class="play-section">
      <p class="play-section-title">⚽ CATEGORÍA</p>
      ${cats.length === 0 ? `
        <div class="empty-state" style="padding:20px">
          <p class="empty-emoji">📂</p>
          <p class="empty-text">No hay categorías</p>
          <button class="btn btn-primary btn-block" onclick="showScreen('content')">
            + CREAR CATEGORÍA
          </button>
        </div>
      ` : `
        <div class="category-chips">
          ${cats.length > 1 ? `
            <div class="category-chip ${state.config.category === 'mixto' ? 'selected' : ''}"
                 onclick="selectCategory('mixto')">
              🎲 Mixto <span class="chip-count">${cats.reduce((s, c) => s + c.words.length, 0)}</span>
            </div>
          ` : ''}
          ${cats.map(cat => {
            const hasEnough = cat.words.length >= minWords;
            const isSelected = state.config.category === cat.id;
            return `
              <div class="category-chip ${isSelected ? 'selected' : ''} ${!hasEnough ? 'warning' : ''}"
                   onclick="selectCategory('${cat.id}')">
                ${cat.emoji} ${escapeHtml(cat.name)} <span class="chip-count">${cat.words.length}</span>
              </div>
            `;
          }).join('')}
        </div>
        ${state.config.category && state.config.category !== 'mixto' ? (() => {
          const cat = getCategoryById(state.config.category);
          if (cat && cat.words.length < minWords) {
            return `<p class="setup-hint" style="color:var(--gold)">⚠️ Necesitás mínimo ${minWords} palabras (esta tiene ${cat.words.length})</p>`;
          }
          return '';
        })() : ''}
        <button class="name-inputs-toggle" onclick="showScreen('content')">
          + Crear categoría
        </button>
      `}
    </div>

    <!-- RESUMEN -->
    <div class="config-summary">
      <span class="config-summary-text">${summaryLine}</span>
    </div>

    <!-- OPCIONES AVANZADAS -->
    <button class="advanced-link" onclick="openAdvancedOptions()">
      ⚙ OPCIONES AVANZADAS
    </button>
  `;
}

function renderNameInputs() {
  let html = '<div class="name-inputs-list">';
  for (let i = 0; i < state.config.playerCount; i++) {
    const name = getPlayerName(i);
    html += `
      <div class="player-name-row">
        <span class="player-name-num">${i + 1}.</span>
        <input type="text" class="player-name-input" value="${escapeHtml(name)}"
               onchange="setPlayerName(${i}, this.value)" maxlength="20"
               placeholder="Jugador ${i + 1}">
      </div>
    `;
  }
  html += '</div>';
  return html;
}

function toggleNameInputs() {
  state.showNames = !state.showNames;
  renderPlayScreen();
}

function adjustPlayerCount(delta) {
  const newVal = state.config.playerCount + delta;
  if (newVal < 4 || newVal > 8) return;
  state.config.playerCount = newVal;
  const maxImp = Math.min(3, newVal - 2);
  if (state.config.impostorCount > maxImp) {
    state.config.impostorCount = maxImp;
  }
  saveLastConfig();
  renderPlayScreen();
  renderStartButton();
}

function getPlaySummary() {
  const parts = [];
  parts.push(state.config.impostorCount + (state.config.impostorCount > 1 ? ' impostores' : ' impostor'));
  parts.push(state.config.hintsEnabled ? 'Pista ON' : 'Sin pista');
  parts.push(state.config.timer === 0 ? '∞' : formatTime(state.config.timer));
  parts.push(state.config.rounds === 0 ? '∞ rondas' : state.config.rounds + ' rondas');
  return parts.join(' · ');
}

function selectCategory(id) {
  state.config.category = id;
  saveLastConfig();
  renderPlayScreen();
  renderStartButton();
  console.log('Category selected:', id);
}

// =============================================
// OPCIONES AVANZADAS
// =============================================
function openAdvancedOptions() {
  const modal = document.getElementById('advanced-modal');
  if (!modal) return;
  modal.classList.add('active');
  renderAdvancedContent();
}

function closeAdvancedOptions() {
  const modal = document.getElementById('advanced-modal');
  if (modal) modal.classList.remove('active');
  renderPlayScreen();
  renderStartButton();
}

function renderAdvancedContent() {
  const body = document.getElementById('advanced-body');
  if (!body) return;

  const maxImp = Math.min(3, state.config.playerCount - 2);

  body.innerHTML = `
    <div class="advanced-section">
      <p class="label">IMPOSTORES</p>
      <div class="player-count-grid">
        ${[1,2,3].filter(n => n <= maxImp).map(n => `
          <div class="player-count-btn ${state.config.impostorCount === n ? 'selected' : ''}"
               onclick="setAdvancedImpostors(${n})">${n}</div>
        `).join('')}
      </div>
      ${state.config.impostorCount > 1 ? `
        <div class="setup-option" style="margin-top:8px">
          <label class="checkbox-label">
            <input type="checkbox" ${state.config.impostorsKnowEachOther ? 'checked' : ''}
                   onchange="state.config.impostorsKnowEachOther = this.checked; saveLastConfig()">
            <span class="checkbox-mark"></span>
            Los impostores saben quiénes son
          </label>
        </div>
      ` : ''}
    </div>

    <div class="advanced-section">
      <p class="label">PISTAS</p>
      <div class="setup-option">
        <label class="checkbox-label">
          <input type="checkbox" ${state.config.hintsEnabled ? 'checked' : ''}
                 onchange="state.config.hintsEnabled = this.checked; saveLastConfig(); renderAdvancedContent()">
          <span class="checkbox-mark"></span>
          Dar pista al impostor
        </label>
      </div>
      <p class="setup-hint">Si está ON, el impostor ve la pista de la palabra. Si la palabra no tiene pista, ve "Sin pista disponible".</p>
    </div>

    <div class="advanced-section">
      <p class="label">RONDAS</p>
      <div class="rounds-grid">
        ${[{n:3,l:'3'},{n:5,l:'5'},{n:7,l:'7'},{n:0,l:'∞'}].map(r => `
          <div class="rounds-btn ${state.config.rounds === r.n ? 'selected' : ''}"
               onclick="setAdvancedRounds(${r.n})">${r.l}</div>
        `).join('')}
      </div>
    </div>

    <div class="advanced-section">
      <p class="label">TIMER DE DISCUSIÓN</p>
      <div class="rounds-grid" style="flex-wrap:wrap">
        ${[{n:30,l:'0:30'},{n:60,l:'1:00'},{n:90,l:'1:30'},{n:120,l:'2:00'},{n:180,l:'3:00'},{n:300,l:'5:00'},{n:0,l:'∞'}].map(t => `
          <div class="rounds-btn ${state.config.timer === t.n ? 'selected' : ''}"
               onclick="setAdvancedTimer(${t.n})">${t.l}</div>
        `).join('')}
      </div>
    </div>

    <div class="advanced-section">
      <p class="label">¿QUÉ PASA EN EMPATE?</p>
      ${CONFIG.TIE_RULES.map(rule => `
        <div class="mode-option ${state.config.tieRule === rule.id ? 'selected' : ''}"
             onclick="setAdvancedTieRule('${rule.id}')">
          <div class="mode-radio"></div>
          <div>
            <div class="mode-label">${rule.name}</div>
            <div class="mode-desc">${rule.desc}</div>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="advanced-section">
      <p class="label">REVELACIÓN</p>
      ${CONFIG.REVEAL_MODES.map(mode => `
        <div class="mode-option ${state.config.revealMode === mode.id ? 'selected' : ''}"
             onclick="setAdvancedRevealMode('${mode.id}')">
          <div class="mode-radio"></div>
          <div>
            <div class="mode-label">${mode.name}</div>
            <div class="mode-desc">${mode.desc}</div>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="advanced-section">
      <p class="label">⚡ RONDA RELÁMPAGO</p>
      <div class="setup-option">
        <label class="checkbox-label">
          <input type="checkbox" ${state.config.lightningEnabled ? 'checked' : ''}
                 onchange="state.config.lightningEnabled = this.checked; saveLastConfig(); renderAdvancedContent()">
          <span class="checkbox-mark"></span>
          Activar ronda relámpago
        </label>
      </div>
      ${state.config.lightningEnabled ? `
        <p class="setup-hint">Después de ronda:</p>
        <div class="rounds-grid" style="margin-top:4px">
          ${CONFIG.LIGHTNING_AFTER.map(n => `
            <div class="rounds-btn ${state.config.lightningAfterRound === n ? 'selected' : ''}"
                 onclick="state.config.lightningAfterRound = ${n}; saveLastConfig(); renderAdvancedContent()">${n}</div>
          `).join('')}
        </div>
        <p class="setup-hint" style="margin-top:8px">Timer discusión:</p>
        <div class="rounds-grid" style="margin-top:4px">
          ${CONFIG.LIGHTNING_TIMER.map(n => `
            <div class="rounds-btn ${state.config.lightningTimer === n ? 'selected' : ''}"
                 onclick="state.config.lightningTimer = ${n}; saveLastConfig(); renderAdvancedContent()">${n}s</div>
          `).join('')}
        </div>
      ` : ''}
    </div>

    <div class="advanced-section">
      <p class="label">🤫 RONDA A MUDAS</p>
      ${CONFIG.SILENCE_OPTIONS.map(opt => `
        <div class="mode-option ${state.config.silenceRound === opt.id ? 'selected' : ''}"
             onclick="state.config.silenceRound = '${opt.id}'; saveLastConfig(); renderAdvancedContent()">
          <div class="mode-radio"></div>
          <div>
            <div class="mode-label">${opt.name}</div>
            <div class="mode-desc">${opt.desc}</div>
          </div>
        </div>
      `).join('')}
      ${state.config.silenceRound !== 'off' ? `
        <p class="setup-hint" style="margin-top:8px">Timer de miradas:</p>
        <div class="rounds-grid" style="margin-top:4px">
          ${CONFIG.SILENCE_TIMER.map(n => `
            <div class="rounds-btn ${state.config.silenceTimerDuration === n ? 'selected' : ''}"
                 onclick="state.config.silenceTimerDuration = ${n}; saveLastConfig(); renderAdvancedContent()">${n}s</div>
          `).join('')}
        </div>
      ` : ''}
    </div>

    <div class="advanced-section">
      <p class="label">SONIDO Y VIBRACIÓN</p>
      <div class="setup-option">
        <label class="checkbox-label">
          <input type="checkbox" ${state.config.soundEnabled ? 'checked' : ''}
                 onchange="state.config.soundEnabled = this.checked; saveLastConfig()">
          <span class="checkbox-mark"></span>
          Efectos de sonido
        </label>
      </div>
      <div class="setup-option">
        <label class="checkbox-label">
          <input type="checkbox" ${state.config.vibrationEnabled ? 'checked' : ''}
                 onchange="state.config.vibrationEnabled = this.checked; saveLastConfig()">
          <span class="checkbox-mark"></span>
          Vibración
        </label>
      </div>
    </div>
  `;
}

function setAdvancedImpostors(n) {
  state.config.impostorCount = n;
  saveLastConfig();
  renderAdvancedContent();
}

function setAdvancedRounds(n) {
  state.config.rounds = n;
  saveLastConfig();
  renderAdvancedContent();
}

function setAdvancedTimer(n) {
  state.config.timer = n;
  saveLastConfig();
  renderAdvancedContent();
}

function setAdvancedTieRule(rule) {
  state.config.tieRule = rule;
  saveLastConfig();
  renderAdvancedContent();
}

function setAdvancedRevealMode(mode) {
  state.config.revealMode = mode;
  saveLastConfig();
  renderAdvancedContent();
}

// =============================================
// BOTÓN COMENZAR
// =============================================
function renderStartButton() {
  const btn = document.getElementById('setup-start-btn');
  if (!btn) {
    console.error('Button not found');
    return;
  }

  let catValid = false;

  if (state.config.category) {
    if (state.config.category === 'mixto') {
      const totalWords = Object.values(categories).reduce((sum, c) => sum + c.words.length, 0);
      catValid = totalWords >= state.config.impostorCount + 1;
    } else {
      const cat = getCategoryById(state.config.category);
      if (cat) {
        catValid = cat.words.length >= state.config.impostorCount + 1;
      }
    }
  }

  btn.disabled = !catValid;
  btn.textContent = catValid ? '▶ JUGAR' : 'ELEGÍ UNA CATEGORÍA';

  // Debug
  console.log('renderStartButton:', {
    category: state.config.category,
    catValid: catValid,
    disabled: btn.disabled
  });
}

function renderSetup() {
  renderPlayScreen();
  renderStartButton();
}

// =============================================
// UTILIDADES
// =============================================
function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}