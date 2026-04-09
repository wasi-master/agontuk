/**
 * Canvas-based confetti animation for the end game screen
 */
class Confetti {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.animId = null;
    this.running = false;
    this.colors = [
      '#6C63FF', '#FF6584', '#FFB347', '#43D9A2',
      '#26C5F3', '#FF4757', '#FFC300', '#A29BFE',
      '#fd79a8', '#55efc4'
    ];
    this._onResize = () => this._resize();
    window.addEventListener('resize', this._onResize);
  }

  _resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  _createParticle(x) {
    const isCircle = Math.random() > 0.5;
    return {
      x: x !== undefined ? x : Math.random() * this.canvas.width,
      y: -20,
      size: Math.random() * 8 + 4,
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
      vx: (Math.random() - 0.5) * 5,
      vy: Math.random() * 3 + 2,
      vr: (Math.random() - 0.5) * 8,
      rotation: Math.random() * 360,
      opacity: 1,
      isCircle
    };
  }

  start() {
    this._resize();
    this.particles = [];
    this.running = true;
    this.canvas.style.display = 'block';

    // Burst from top across full width
    for (let i = 0; i < 200; i++) {
      const p = this._createParticle();
      p.y = Math.random() * -200;
      p.vy = Math.random() * 4 + 1.5;
      this.particles.push(p);
    }

    this._animate();

    // Keep adding particles for 3 seconds
    let count = 0;
    const burst = setInterval(() => {
      if (!this.running || count > 6) { clearInterval(burst); return; }
      for (let i = 0; i < 30; i++) {
        this.particles.push(this._createParticle());
      }
      count++;
    }, 400);
  }

  _animate() {
    if (!this.running) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.06;          // gravity
      p.vx *= 0.99;          // air resistance
      p.rotation += p.vr;

      // Fade out when near bottom
      if (p.y > this.canvas.height * 0.8) {
        p.opacity -= 0.025;
      }
      if (p.opacity <= 0 || p.y > this.canvas.height + 20) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = p.opacity;
      this.ctx.fillStyle = p.color;
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);

      if (p.isCircle) {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        this.ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      }

      this.ctx.restore();
    }

    if (this.particles.length > 0) {
      this.animId = requestAnimationFrame(() => this._animate());
    } else {
      this.stop();
    }
  }

  stop() {
    this.running = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.canvas.style.display = 'none';
  }
}

const confetti = new Confetti('confetti-canvas');
