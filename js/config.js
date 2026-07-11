// =============================================
// CONFIGURACIÓN v3
// =============================================
const CONFIG = {
  MIN_PLAYERS: 4,
  MAX_PLAYERS: 10,
  TIMER_OPTIONS: [30, 60, 90, 120, 180, 300, 0],
  ROUND_OPTIONS: [3, 5, 7, 0],
  TIE_RULES: [
    { id: 'impostor_wins', name: 'Impostor gana', desc: 'El impostor recibe puntos por empate' },
    { id: 'nobody', name: 'Nadie es eliminado', desc: 'Se repite la ronda sin cambios' },
    { id: 'random', name: 'Al azar', desc: 'Se elige al azar entre los empatados' }
  ],
  REVEAL_MODES: [
    { id: 'pass_and_play', name: 'Pass & Play', desc: 'Cada uno ve su carta en secreto' },
    { id: 'simultaneous', name: 'Todos juntos', desc: 'Cada uno mira su carta a la vez con timer' }
  ],
  SILENCE_OPTIONS: [
    { id: 'off', name: 'OFF', desc: 'Sin rondas a mudas' },
    { id: 'first', name: 'Primera ronda', desc: 'La primera ronda es sin hablar' },
    { id: 'random', name: 'Aleatoria', desc: 'Aparece al azar en alguna ronda' }
  ],
  LIGHTNING_AFTER: [3, 4, 5],
  LIGHTNING_TIMER: [15, 20, 30],
  LIGHTNING_VOTE: [5, 10, 15],
  SILENCE_TIMER: [15, 20, 30]
};