/**
 * BorderGlow - React Bits Component (JavaScript + CSS)
 * Implements cursor-following directional border glow with mesh gradient edges
 */

(function () {
  function parseHSL(hslStr) {
    const match = hslStr.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/);
    if (!match) return { h: 40, s: 80, l: 80 };
    return { h: parseFloat(match[1]), s: parseFloat(match[2]), l: parseFloat(match[3]) };
  }

  function buildGlowVars(glowColor, intensity) {
    const { h, s, l } = parseHSL(glowColor);
    const base = `${h}deg ${s}% ${l}%`;
    const opacities = [100, 60, 50, 40, 30, 20, 10];
    const keys = ['', '-60', '-50', '-40', '-30', '-20', '-10'];
    const vars = {};
    for (let i = 0; i < opacities.length; i++) {
      vars[`--glow-color${keys[i]}`] = `hsl(${base} / ${Math.min(opacities[i] * intensity, 100)}%)`;
    }
    return vars;
  }

  const GRADIENT_POSITIONS = ['80% 55%', '69% 34%', '8% 6%', '41% 38%', '86% 85%', '82% 18%', '51% 4%'];
  const GRADIENT_KEYS = ['--gradient-one', '--gradient-two', '--gradient-three', '--gradient-four', '--gradient-five', '--gradient-six', '--gradient-seven'];
  const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1];

  function buildGradientVars(colors) {
    const vars = {};
    for (let i = 0; i < 7; i++) {
      const c = colors[Math.min(COLOR_MAP[i], colors.length - 1)];
      vars[GRADIENT_KEYS[i]] = `radial-gradient(at ${GRADIENT_POSITIONS[i]}, ${c} 0px, transparent 50%)`;
    }
    vars['--gradient-base'] = `linear-gradient(${colors[0]} 0 100%)`;
    return vars;
  }

  function isLightColor(color) {
    const value = color.trim().replace('#', '');
    if (!/^[\da-f]{3}([\da-f]{3})?$/i.test(value)) return false;
    const hex = value.length === 3 ? value.split('').map(char => char + char).join('') : value;
    const red = parseInt(hex.slice(0, 2), 16);
    const green = parseInt(hex.slice(2, 4), 16);
    const blue = parseInt(hex.slice(4, 6), 16);
    return red * 0.2126 + green * 0.7152 + blue * 0.0722 > 180;
  }

  function easeOutCubic(x) { return 1 - Math.pow(1 - x, 3); }
  function easeInCubic(x) { return x * x * x; }

  function animateValue({ start = 0, end = 100, duration = 1000, delay = 0, ease = easeOutCubic, onUpdate, onEnd }) {
    const t0 = performance.now() + delay;
    function tick() {
      const elapsed = performance.now() - t0;
      const t = Math.min(elapsed / duration, 1);
      onUpdate(start + (end - start) * ease(t));
      if (t < 1) requestAnimationFrame(tick);
      else if (onEnd) onEnd();
    }
    setTimeout(() => requestAnimationFrame(tick), delay);
  }

  function getCenterOfElement(el) {
    const { width, height } = el.getBoundingClientRect();
    return [width / 2, height / 2];
  }

  function getEdgeProximity(el, x, y) {
    const [cx, cy] = getCenterOfElement(el);
    const dx = x - cx;
    const dy = y - cy;
    let kx = Infinity;
    let ky = Infinity;
    if (dx !== 0) kx = cx / Math.abs(dx);
    if (dy !== 0) ky = cy / Math.abs(dy);
    return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
  }

  function getCursorAngle(el, x, y) {
    const [cx, cy] = getCenterOfElement(el);
    const dx = x - cx;
    const dy = y - cy;
    if (dx === 0 && dy === 0) return 0;
    const radians = Math.atan2(dy, dx);
    let degrees = radians * (180 / Math.PI) + 90;
    if (degrees < 0) degrees += 360;
    return degrees;
  }

  function attachBorderGlow(card, customConfig = {}) {
    if (!card) return;

    const isLightMode = document.documentElement.getAttribute('data-theme') === 'light';

    const config = Object.assign({
      edgeSensitivity: 30,
      glowColor: '40 80 80',
      backgroundColor: isLightMode ? '#ffffff' : '#111827',
      borderRadius: 16,
      glowRadius: 36,
      glowIntensity: 1.0,
      coneSpread: 25,
      animated: true,
      colors: ['#c084fc', '#f472b6', '#38bdf8'],
      fillOpacity: 0.5
    }, customConfig);

    card.classList.add('border-glow-card');
    if (isLightColor(config.backgroundColor)) {
      card.classList.add('border-glow-card--light');
    }

    // Ensure edge-light span exists
    let edgeLight = card.querySelector(':scope > .edge-light');
    if (!edgeLight) {
      edgeLight = document.createElement('span');
      edgeLight.className = 'edge-light';
      card.insertBefore(edgeLight, card.firstChild);
    }

    // Set CSS Properties
    card.style.setProperty('--card-bg', config.backgroundColor);
    card.style.setProperty('--edge-sensitivity', config.edgeSensitivity);
    card.style.setProperty('--border-radius', `${config.borderRadius}px`);
    card.style.setProperty('--glow-padding', `${config.glowRadius}px`);
    card.style.setProperty('--cone-spread', config.coneSpread);
    card.style.setProperty('--fill-opacity', config.fillOpacity);

    const glowVars = buildGlowVars(config.glowColor, config.glowIntensity);
    for (const [k, v] of Object.entries(glowVars)) {
      card.style.setProperty(k, v);
    }

    const gradVars = buildGradientVars(config.colors);
    for (const [k, v] of Object.entries(gradVars)) {
      card.style.setProperty(k, v);
    }

    function handlePointerMove(e) {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const edge = getEdgeProximity(card, x, y);
      const angle = getCursorAngle(card, x, y);

      card.style.setProperty('--edge-proximity', `${(edge * 100).toFixed(3)}`);
      card.style.setProperty('--cursor-angle', `${angle.toFixed(3)}deg`);
    }

    function handlePointerLeave() {
      card.style.setProperty('--edge-proximity', '0');
    }

    card.addEventListener('pointermove', handlePointerMove);
    card.addEventListener('pointerleave', handlePointerLeave);

    // Optional sweep animation
    if (config.animated) {
      const angleStart = 110;
      const angleEnd = 465;
      card.classList.add('sweep-active');
      card.style.setProperty('--cursor-angle', `${angleStart}deg`);

      animateValue({ duration: 500, onUpdate: v => card.style.setProperty('--edge-proximity', v) });
      animateValue({ ease: easeInCubic, duration: 1500, end: 50, onUpdate: v => {
        card.style.setProperty('--cursor-angle', `${(angleEnd - angleStart) * (v / 100) + angleStart}deg`);
      }});
      animateValue({ ease: easeOutCubic, delay: 1500, duration: 2250, start: 50, end: 100, onUpdate: v => {
        card.style.setProperty('--cursor-angle', `${(angleEnd - angleStart) * (v / 100) + angleStart}deg`);
      }});
      animateValue({ ease: easeInCubic, delay: 2500, duration: 1500, start: 100, end: 0,
        onUpdate: v => card.style.setProperty('--edge-proximity', v),
        onEnd: () => card.classList.remove('sweep-active'),
      });
    }

    // Listen for theme switch to update background color
    const observer = new MutationObserver(() => {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      const newBg = isLight ? '#ffffff' : '#111827';
      card.style.setProperty('--card-bg', newBg);
      card.classList.toggle('border-glow-card--light', isLight);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  function initBorderGlow(selector = '.border-glow-card, .app-header, .tender-hero-card, .panel-card, .readiness-meter-box', options = {}) {
    const cards = document.querySelectorAll(selector);
    cards.forEach(card => attachBorderGlow(card, options));
  }

  window.initBorderGlow = initBorderGlow;
  window.attachBorderGlow = attachBorderGlow;
})();
