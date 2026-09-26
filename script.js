// ============================================================
// M P Akash — Portfolio v2 interactions
// Active nav highlighting, mobile menu, scroll-reveal animation
// ============================================================

// ---- Animated network background ----
// A sparse field of drifting nodes connected by faint lines when close
// to each other — nods to "distributed systems / AI" without being loud.
// Pauses on prefers-reduced-motion and when the tab is hidden.
(function initNetworkBackground() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const ctx = canvas.getContext('2d');
  let width, height, pageHeight, nodes, dpr;
  let running = true;
  let rafId = null;

  function currentAccent() {
    const theme = document.documentElement.getAttribute('data-theme');
    return theme === 'light' ? '20, 120, 165' : '92, 196, 234';
  }
  let ACCENT = currentAccent();
  window.__updateNetworkAccent = () => { ACCENT = currentAccent(); };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    pageHeight = Math.max(document.documentElement.scrollHeight, height);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seedNodes();
  }

  function seedNodes() {
    const area = width * pageHeight;
    const count = Math.max(24, Math.min(600, Math.round(area / 22000)));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * pageHeight,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      r: Math.random() * 1.6 + 0.9
    }));
  }

  const LINK_DIST = 150;

  function step() {
    if (!running) return;
    ctx.clearRect(0, 0, width, height);
    const scrollY = window.scrollY;

    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > width) n.vx *= -1;
      if (n.y < 0 || n.y > pageHeight) n.vy *= -1;
    }

    const visibleNodes = nodes
      .filter(n => n.y - scrollY >= -LINK_DIST && n.y - scrollY <= height + LINK_DIST)
      .map(n => ({ node: n, screenY: n.y - scrollY }));

    for (let i = 0; i < visibleNodes.length; i++) {
      for (let j = i + 1; j < visibleNodes.length; j++) {
        const a = visibleNodes[i], b = visibleNodes[j];
        const dx = a.node.x - b.node.x, dy = a.screenY - b.screenY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < LINK_DIST) {
          const alpha = (1 - dist / LINK_DIST) * 0.8;
          ctx.strokeStyle = `rgba(${ACCENT}, ${alpha})`;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(a.node.x, a.screenY);
          ctx.lineTo(b.node.x, b.screenY);
          ctx.stroke();
        }
      }
    }

    for (const { node: n, screenY } of visibleNodes) {
      ctx.fillStyle = `rgba(${ACCENT}, 0.95)`;
      ctx.beginPath();
      ctx.arc(n.x, screenY, n.r, 0, Math.PI * 2);
      ctx.fill();
    }

    rafId = requestAnimationFrame(step);
  }

  function start() {
    if (rafId) return;
    running = true;
    rafId = requestAnimationFrame(step);
  }
  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => {
    document.hidden ? stop() : start();
  });

  resize();
  start();
})();

document.addEventListener('DOMContentLoaded', () => {
  // ---- Theme (light/dark) ----
  const THEME_KEY = 'akash-portfolio-theme';
  const root = document.documentElement;
  const toggles = [document.getElementById('themeToggle'), document.getElementById('themeToggleMobile')].filter(Boolean);

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    toggles.forEach(btn => btn.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false'));
    if (window.__updateNetworkAccent) window.__updateNetworkAccent();
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* storage unavailable, ignore */ }
  }

  let savedTheme = 'dark';
  try { savedTheme = localStorage.getItem(THEME_KEY) || 'dark'; } catch (e) { /* ignore */ }
  applyTheme(savedTheme);

  toggles.forEach(btn => {
    btn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      applyTheme(next);
    });
  });

  const navLinks = document.querySelectorAll('.nav__links a[data-target]');
  const sections = document.querySelectorAll('main section[id]');
  const navToggle = document.getElementById('navToggle');
  const navMobile = document.getElementById('navMobile');

  // Active link on scroll
  const spy = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.classList.toggle('active', link.dataset.target === entry.target.id);
        });
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
  sections.forEach(sec => spy.observe(sec));

  // Mobile menu toggle
  if (navToggle && navMobile) {
    navToggle.addEventListener('click', () => {
      const open = navMobile.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navMobile.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        navMobile.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Scroll reveal
  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => revealObserver.observe(el));
});