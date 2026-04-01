/**
 * Particle Network Animation — Neural Network Style
 * Creates an interactive canvas with connected particles
 */
class ParticleNetwork {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: null, y: null, radius: 150 };
    this.config = {
      particleCount: 80,
      maxDistance: 160,
      particleMinRadius: 1,
      particleMaxRadius: 2.5,
      speed: 0.3,
      colors: ['59,130,246', '6,182,212', '139,92,246'], // blue, cyan, purple
    };
    this.animId = null;
    this.init();
  }

  init() {
    this.resize();
    this.createParticles();
    this.bindEvents();
    this.animate();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.scale(dpr, dpr);
    this.width = rect.width;
    this.height = rect.height;

    // Adjust particle count for mobile
    if (this.width < 768) {
      this.config.particleCount = 40;
      this.config.maxDistance = 120;
    }
  }

  createParticles() {
    this.particles = [];
    for (let i = 0; i < this.config.particleCount; i++) {
      const colorIdx = Math.floor(Math.random() * this.config.colors.length);
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * this.config.speed,
        vy: (Math.random() - 0.5) * this.config.speed,
        radius: Math.random() * (this.config.particleMaxRadius - this.config.particleMinRadius) + this.config.particleMinRadius,
        color: this.config.colors[colorIdx],
        opacity: Math.random() * 0.5 + 0.3,
      });
    }
  }

  bindEvents() {
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.resize();
        this.createParticles();
      }, 250);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.mouse.x = null;
      this.mouse.y = null;
    });
  }

  updateParticles() {
    for (const p of this.particles) {
      // Mouse interaction
      if (this.mouse.x !== null) {
        const dx = p.x - this.mouse.x;
        const dy = p.y - this.mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          p.vx += (dx / dist) * force * 0.02;
          p.vy += (dy / dist) * force * 0.02;
        }
      }

      // Damping
      p.vx *= 0.99;
      p.vy *= 0.99;

      // Move
      p.x += p.vx;
      p.y += p.vy;

      // Bounce
      if (p.x < 0 || p.x > this.width) p.vx *= -1;
      if (p.y < 0 || p.y > this.height) p.vy *= -1;
      p.x = Math.max(0, Math.min(this.width, p.x));
      p.y = Math.max(0, Math.min(this.height, p.y));
    }
  }

  drawConnections() {
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const a = this.particles[i];
        const b = this.particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.config.maxDistance) {
          const opacity = (1 - dist / this.config.maxDistance) * 0.25;
          this.ctx.beginPath();
          this.ctx.moveTo(a.x, a.y);
          this.ctx.lineTo(b.x, b.y);
          this.ctx.strokeStyle = `rgba(59, 130, 246, ${opacity})`;
          this.ctx.lineWidth = 0.8;
          this.ctx.stroke();
        }
      }
    }
  }

  drawParticles() {
    for (const p of this.particles) {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${p.color}, ${p.opacity})`;
      this.ctx.fill();

      // Glow
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${p.color}, ${p.opacity * 0.1})`;
      this.ctx.fill();
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.updateParticles();
    this.drawConnections();
    this.drawParticles();
    this.animId = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('particle-canvas')) {
    new ParticleNetwork('particle-canvas');
  }
});
