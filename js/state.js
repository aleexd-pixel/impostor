// =============================================
// ESTADO DE LA APLICACIÓN v2
// =============================================
let state = {
  phase: 'home',

  // Configuración de la partida
  config: {
    playerCount: 5,
    impostorCount: 1,
    category: null,
    rounds: 3,
    timer: 120,
    tieRule: 'impostor_wins',
    revealMode: 'pass_and_play',
    impostorsKnowEachOther: true,
    hintsEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    // Rondas especiales
    lightningEnabled: true,
    lightningAfterRound: 3,
    lightningTimer: 20,
    lightningVote: 10,
    silenceRound: 'off',
    silenceTimerDuration: 20,
    nightStatsEnabled: true
  },

  // Nombres de jugadores
  playerNames: [],

  // Estado de la partida en curso
  players: [],
  currentRound: 1,
  currentRevealIndex: 0,
  secretWord: '',
  secretHint: '',
  secretCategory: '',
  impostorIndices: [],
  eliminatedPlayers: [],
  scores: {},
  usedWords: {},
  roundHistory: [],
  timerInterval: null,
  timeRemaining: 0,
  cardFlipped: false,
  isTransitioning: false,

  // Rondas especiales
  lightningUsed: false,
  silenceRoundUsed: false,
  currentRoundType: 'normal',
  lightningStarter: null,
  lightningRevealMode: false,
  lightningRevealTimer: null,

  // UI state
  debugOpen: false,
  contentCategory: null,
  editingCategory: null,
  showNames: false
};

// =============================================
// UTILIDADES
// =============================================
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function vibrate(pattern) {
  if (!state.config.vibrationEnabled) return;
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) {}
}

function formatTime(seconds) {
  const abs = Math.abs(seconds);
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  return (seconds < 0 ? '-' : '') + m + ':' + (s < 10 ? '0' : '') + s;
}

function showToast(msg, type) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = type ? type : '';
  requestAnimationFrame(() => {
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 2500);
  });
}

// =============================================
// PLAYER NAMES
// =============================================
function getPlayerName(index) {
  if (state.playerNames[index]) return state.playerNames[index];
  return 'Jugador ' + (index + 1);
}

function setPlayerName(index, name) {
  state.playerNames[index] = name;
  savePlayerNames();
}