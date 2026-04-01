/**
 * Main.js — Navigation, theme toggle, scroll effects, skills, counters
 */
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavbar();
    initMobileNav();
    initScrollReveal();
    initBackToTop();
    initSkills();
    initCounters();
    initNavActiveState();
  });

  /* ---- Theme Toggle ---- */
  function initTheme() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;
    const icon = toggle.querySelector('.theme-icon');
    const saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    if (icon) icon.textContent = saved === 'dark' ? '🌙' : '☀️';

    toggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      if (icon) icon.textContent = next === 'dark' ? '🌙' : '☀️';
    });
  }

  /* ---- Navbar Scroll ---- */
  function initNavbar() {
    const nav = document.getElementById('navbar');
    if (!nav) return;
    // If already has .scrolled class (blog pages), skip
    if (nav.classList.contains('scrolled')) return;

    function onScroll() {
      if (window.scrollY > 50) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---- Mobile Nav ---- */
  function initMobileNav() {
    const toggle = document.getElementById('nav-toggle');
    const links = document.getElementById('nav-links');
    if (!toggle || !links) return;

    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      links.classList.toggle('open');
    });

    // Close on link click
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        toggle.classList.remove('active');
        links.classList.remove('open');
      });
    });
  }

  /* ---- Scroll Reveal (Intersection Observer) ---- */
  function initScrollReveal() {
    const elements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-children');
    if (!elements.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    elements.forEach(el => observer.observe(el));
  }

  /* ---- Back to Top ---- */
  function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 600) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    }, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---- Skills Grid ---- */
  function initSkills() {
    const grid = document.getElementById('skills-grid');
    if (!grid) return;

    const skills = [
      { name: 'Python', icon: '🐍' },
      { name: 'PyTorch', icon: '🔥' },
      { name: 'TensorFlow', icon: '🧠' },
      { name: 'C/C++', icon: '⚙️' },
      { name: 'STM32', icon: '🔧' },
      { name: 'ONNX', icon: '📦' },
      { name: 'TFLite', icon: '📱' },
      { name: 'Prompt Engineering', icon: '💡' },
      { name: 'Git', icon: '🌿' },
      { name: 'Linux', icon: '🐧' },
      { name: 'Docker', icon: '🐳' },
      { name: 'MATLAB', icon: '📊' },
    ];

    grid.innerHTML = skills.map(s =>
      `<div class="skill-tag"><span class="skill-icon">${s.icon}</span>${s.name}</div>`
    ).join('');
  }

  /* ---- Number Counter Animation ---- */
  function initCounters() {
    const counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(el => observer.observe(el));
  }

  function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    const duration = 2000;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out
      const ease = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * ease);
      if (progress < 1) requestAnimationFrame(update);
      else el.textContent = target >= 1000 ? target.toLocaleString() : target;
    }
    requestAnimationFrame(update);
  }

  /* ---- Active Nav Link on Scroll ---- */
  function initNavActiveState() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    if (!sections.length || !navLinks.length) return;

    window.addEventListener('scroll', () => {
      let current = '';
      sections.forEach(section => {
        const top = section.offsetTop - 100;
        if (window.scrollY >= top) current = section.id;
      });

      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
          link.classList.add('active');
        }
      });
    }, { passive: true });
  }
})();
