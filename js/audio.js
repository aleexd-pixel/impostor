// =============================================
// AUDIO (Web Audio API)
// =============================================
const AudioMgr = {
  ctx: null,

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch (e) { /* audio not supported */ }
  },

  _beep(freq, duration, type, vol) {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.frequency.value = freq;
      osc.type = type || 'sine';
      gain.gain.setValueAtTime(vol || 0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) { /* ignore */ }
  },

  click() { this._beep(900, 0.04, 'sine', 0.08); },

  reveal() {
    this._beep(330, 0.3, 'triangle', 0.1);
    setTimeout(() => this._beep(440, 0.3, 'triangle', 0.1), 80);
    setTimeout(() => this._beep(550, 0.4, 'triangle', 0.12), 160);
  },

  impostor() {
    this._beep(180, 0.4, 'sawtooth', 0.08);
    setTimeout(() => this._beep(190, 0.4, 'sawtooth', 0.08), 100);
  },

  victory() {
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => this._beep(f, 0.25, 'triangle', 0.1), i * 120);
    });
  },

  defeat() {
    this._beep(300, 0.35, 'sawtooth', 0.07);
    setTimeout(() => this._beep(200, 0.5, 'sawtooth', 0.07), 250);
  },

  tick() { this._beep(1000, 0.025, 'square', 0.05); },

  countdown() { this._beep(600, 0.15, 'sine', 0.1); },

  alarm() {
    this._beep(700, 0.12, 'square', 0.08);
    setTimeout(() => this._beep(900, 0.12, 'square', 0.08), 150);
    setTimeout(() => this._beep(700, 0.12, 'square', 0.08), 300);
    setTimeout(() => this._beep(900, 0.12, 'square', 0.08), 450);
  },

  thunder() {
    if (!this.ctx) return;
    try {
      // White noise burst
      const bufferSize = this.ctx.sampleRate * 0.05;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
      noise.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start();

      // Descending tone
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.frequency.setValueAtTime(200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {}
  },

  gong() {
    this._beep(120, 1.5, 'sine', 0.15);
    setTimeout(() => this._beep(180, 1.2, 'sine', 0.08), 50);
  }
};