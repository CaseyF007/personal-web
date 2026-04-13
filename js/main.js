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

  /* ---- Back to Top（进度环 + 百分比 / 箭头切换） ---- */
  function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;

    const ringFill = btn.querySelector('.btt-ring-fill');
    const percentEl = document.getElementById('btt-percent');
    const CIRCUMFERENCE = 2 * Math.PI * 21; // ≈ 131.95，与 CSS 中一致
    let scrollTimer = null;

    /**
     * 计算页面滚动百分比并更新进度环
     */
    function updateProgress() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const percent = Math.min(Math.round((scrollTop / docHeight) * 100), 100);

      // 更新 SVG 圆环 offset
      const offset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;
      if (ringFill) ringFill.style.strokeDashoffset = offset;

      // 更新百分比文字
      if (percentEl) percentEl.textContent = percent + '%';

      // 显示 / 隐藏按钮（页面顶部隐藏）
      if (scrollTop > 100) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    }

    window.addEventListener('scroll', () => {
      updateProgress();

      // 滚动时显示百分比
      btn.classList.add('show-percent');

      // 重置计时器 — 停止滚动 500ms 后切回箭头
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        btn.classList.remove('show-percent');
      }, 500);
    }, { passive: true });

    // 点击回到顶部
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // 初始状态
    updateProgress();
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
    const navLinks = document.querySelectorAll('.nav-links a');
    if (!sections.length || !navLinks.length) return;

    window.addEventListener('scroll', () => {
      let current = '';
      // 使用视口中心点判定当前板块，解决大板块内切换滞后的问题
      const viewportCenter = window.scrollY + window.innerHeight / 2;
      sections.forEach(section => {
        const top = section.offsetTop;
        const bottom = top + section.offsetHeight;
        if (viewportCenter >= top && viewportCenter < bottom) {
          current = section.id;
        }
      });
      // 如果滚动到页面底部，强制激活最后一个板块
      if (!current && (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50) {
        current = sections[sections.length - 1].id;
      }
      // 如果仍然没有匹配（可能在页面最顶部），使用第一个板块
      if (!current) current = sections[0].id;

      navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href === `#${current}`) {
          link.classList.add('active');
        } else if (current === 'blog' && href === 'blog.html') {
          link.classList.add('active');
        }
      });
    }, { passive: true });
  }
})();
