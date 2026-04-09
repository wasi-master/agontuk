/**
 * Sound effects using Web Audio API
 * Generates sounds programmatically — no audio files needed, works fully offline
 */
class SoundEffects {
  constructor() {
    this._ctx = null;
    this.enabled = true;
  }

  _getCtx() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume if suspended (browser autoplay policy)
    if (this._ctx.state === 'suspended') {
      this._ctx.resume();
    }
    return this._ctx;
  }

  _tone(freq, duration, type = 'sine', gain = 0.25, delay = 0) {
    if (!this.enabled) return;
    try {
      const ctx = this._getCtx();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
      gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + delay + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration + 0.05);
    } catch (e) {
      // Silently fail — audio not critical
    }
  }

  /** Short click/tap sound */
  tap() {
    this._tone(900, 0.08, 'square', 0.15);
  }

  /** Card flip whoosh */
  flip() {
    this._tone(350, 0.12, 'triangle', 0.2);
    this._tone(550, 0.10, 'triangle', 0.15, 0.07);
  }

  /** Reveal card (pleasant ding) */
  reveal() {
    this._tone(880, 0.2, 'sine', 0.25);
    this._tone(1100, 0.15, 'sine', 0.2, 0.15);
  }

  /** Timer tick (subtle) */
  tick() {
    this._tone(1200, 0.04, 'square', 0.08);
  }

  /** Timer warning (last 10 seconds) */
  tickWarning() {
    this._tone(1400, 0.06, 'square', 0.12);
  }

  /** End game fanfare */
  endGame() {
    const notes = [523, 659, 784, 1047, 784, 1047];
    notes.forEach((freq, i) => {
      this._tone(freq, 0.3, 'sine', 0.25, i * 0.12);
    });
  }

  /** Success / rematch */
  success() {
    [523, 659, 784].forEach((freq, i) => {
      this._tone(freq, 0.25, 'sine', 0.2, i * 0.1);
    });
  }
}

const sounds = new SoundEffects();
