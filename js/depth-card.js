/**
 * Depth Card - React Bits Pro Component (JavaScript + CSS)
 * Perspective depth effect that responds to mouse movement
 * 
 * Category: 3D & Shaders
 * Official Docs: https://pro.reactbits.dev/docs/components/depth-card
 */

(function () {
  'use strict';

  // Check if device is mobile or touch-only
  function isTouchDevice() {
    return (
      ('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0) ||
      window.matchMedia('(hover: none)').matches ||
      window.matchMedia('(max-width: 768px)').matches
    );
  }

  /**
   * Attach 3D perspective depth effect to a single element
   * @param {HTMLElement} card - Target card DOM element
   * @param {Object} userOptions - Configurable properties matching React Bits Pro Depth Card
   */
  function attachDepthCard(card, userOptions = {}) {
    if (!card || card._depthCardAttached) return;
    card._depthCardAttached = true;

    const options = Object.assign({
      maxRotation: 12,       // Maximum rotation angle in degrees
      maxTranslation: 10,    // Maximum parallax translation in pixels
      perspective: 1000,     // Perspective depth
      scale: 1.018,          // Subtle scale lift on hover
      spotlight: true,       // Cursor spotlight gradient overlay
      spotlightColor: '',    // Custom spotlight color (empty = uses theme CSS)
      glare: true,           // Specular sheen glare reflection
      glareOpacity: 0.22,    // Maximum opacity of glare
      disableOnMobile: true, // Disable 3D tilt on touch/mobile
      lerpSpeed: 0.16        // Inertia damping speed (0.1 = heavy, 0.2 = snappy)
    }, userOptions);

    if (options.disableOnMobile && isTouchDevice()) {
      return; // Gracefully skip for touch devices to preserve native scroll
    }

    card.classList.add('depth-card');
    card.style.setProperty('--depth-perspective', `${options.perspective}px`);

    // Create Spotlight layer if enabled and not already present
    let spotlightEl = card.querySelector(':scope > .depth-card-spotlight');
    if (options.spotlight && !spotlightEl) {
      spotlightEl = document.createElement('div');
      spotlightEl.className = 'depth-card-spotlight';
      card.appendChild(spotlightEl);
    }
    if (options.spotlightColor) {
      card.style.setProperty('--depth-spotlight-color', options.spotlightColor);
    }

    // Create Glare layer if enabled and not already present
    let glareEl = card.querySelector(':scope > .depth-card-glare');
    if (options.glare && !glareEl) {
      glareEl = document.createElement('div');
      glareEl.className = 'depth-card-glare';
      card.appendChild(glareEl);
    }

    // Internal animation state
    let isHovered = false;
    let rafId = null;

    let targetRotX = 0;
    let targetRotY = 0;
    let targetTransX = 0;
    let targetTransY = 0;
    let targetScale = 1;
    let targetGlareOpacity = 0;
    let targetGlareAngle = 135;

    let currentRotX = 0;
    let currentRotY = 0;
    let currentTransX = 0;
    let currentTransY = 0;
    let currentScale = 1;
    let currentGlareOpacity = 0;

    let spotX = 50;
    let spotY = 50;

    function renderFrame() {
      // Linear interpolation (lerp) for liquid-smooth physics
      const k = options.lerpSpeed;
      currentRotX += (targetRotX - currentRotX) * k;
      currentRotY += (targetRotY - currentRotY) * k;
      currentTransX += (targetTransX - currentTransX) * k;
      currentTransY += (targetTransY - currentTransY) * k;
      currentScale += (targetScale - currentScale) * k;
      currentGlareOpacity += (targetGlareOpacity - currentGlareOpacity) * k;

      // Update card 3D transform & custom properties
      card.style.transform = `perspective(${options.perspective}px) rotateX(${currentRotX.toFixed(3)}deg) rotateY(${currentRotY.toFixed(3)}deg) translate3d(${currentTransX.toFixed(2)}px, ${currentTransY.toFixed(2)}px, 0px) scale3d(${currentScale.toFixed(4)}, ${currentScale.toFixed(4)}, 1)`;
      card.style.setProperty('--depth-glare-opacity', `${currentGlareOpacity.toFixed(3)}`);
      card.style.setProperty('--depth-glare-angle', `${targetGlareAngle.toFixed(1)}deg`);

      // Dynamic 3D directional drop shadow
      const shadowX = (-currentRotY * 1.2).toFixed(1);
      const shadowY = (Math.abs(currentRotX) * 0.8 + 8).toFixed(1);
      const shadowBlur = (24 + Math.abs(currentRotX) + Math.abs(currentRotY)).toFixed(1);
      card.style.boxShadow = `${shadowX}px ${shadowY}px ${shadowBlur}px rgba(0, 0, 0, 0.32)`;

      // Check if we should continue RAF
      const isResting = 
        Math.abs(targetRotX - currentRotX) < 0.05 &&
        Math.abs(targetRotY - currentRotY) < 0.05 &&
        Math.abs(targetTransX - currentTransX) < 0.05 &&
        Math.abs(targetTransY - currentTransY) < 0.05 &&
        Math.abs(targetScale - currentScale) < 0.002;

      if (!isHovered && isResting) {
        // Returned to rest position
        card.classList.remove('depth-active');
        card.style.transform = '';
        card.style.removeProperty('--depth-glare-opacity');
        card.style.removeProperty('box-shadow');
        rafId = null;
        return;
      }

      rafId = requestAnimationFrame(renderFrame);
    }

    function onPointerEnter(e) {
      // If event was triggered by a nested depth card, allow nested card to handle
      if (e.target !== card && e.target.closest('.depth-card') !== card) {
        return;
      }
      isHovered = true;
      card.classList.add('depth-active');
      targetScale = options.scale;
      if (!rafId) {
        rafId = requestAnimationFrame(renderFrame);
      }
    }

    function onPointerMove(e) {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // If pointer is over a nested depth card inside this card, ease outer card to rest
      const closestDepthCard = e.target.closest('.depth-card');
      if (closestDepthCard && closestDepthCard !== card && card.contains(closestDepthCard)) {
        targetRotX = 0;
        targetRotY = 0;
        targetTransX = 0;
        targetTransY = 0;
        targetScale = 1;
        targetGlareOpacity = 0;
        if (!rafId) {
          rafId = requestAnimationFrame(renderFrame);
        }
        return;
      }

      // Update spotlight position
      spotX = x;
      spotY = y;
      card.style.setProperty('--depth-spotlight-x', `${x.toFixed(1)}px`);
      card.style.setProperty('--depth-spotlight-y', `${y.toFixed(1)}px`);

      // Normalised coordinates (-1 to 1 from center)
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const normX = Math.max(-1, Math.min(1, (x - centerX) / centerX));
      const normY = Math.max(-1, Math.min(1, (y - centerY) / centerY));

      // Calculate target 3D angles
      targetRotX = -normY * options.maxRotation;
      targetRotY = normX * options.maxRotation;
      targetTransX = normX * options.maxTranslation;
      targetTransY = normY * options.maxTranslation;

      // Calculate specular glare angle & intensity
      const angleRad = Math.atan2(y - centerY, x - centerX);
      targetGlareAngle = angleRad * (180 / Math.PI) - 90;
      const distFromCenter = Math.sqrt(normX * normX + normY * normY);
      targetGlareOpacity = Math.min(distFromCenter * options.glareOpacity, options.glareOpacity);

      if (!isHovered) {
        isHovered = true;
        card.classList.add('depth-active');
        targetScale = options.scale;
      }

      if (!rafId) {
        rafId = requestAnimationFrame(renderFrame);
      }
    }

    function onPointerLeave() {
      isHovered = false;
      targetRotX = 0;
      targetRotY = 0;
      targetTransX = 0;
      targetTransY = 0;
      targetScale = 1;
      targetGlareOpacity = 0;

      if (!rafId) {
        rafId = requestAnimationFrame(renderFrame);
      }
    }

    card.addEventListener('pointerenter', onPointerEnter);
    card.addEventListener('pointermove', onPointerMove);
    card.addEventListener('pointerleave', onPointerLeave);
  }

  /**
   * Initialize DepthCard across all elements matching selector
   * @param {string} selector 
   * @param {Object} options 
   */
  function initDepthCard(selector = '.depth-card, .panel-card, .tender-hero-card, .app-header, .readiness-meter-box, .options-group, .file-card', options = {}) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => attachDepthCard(el, options));
  }

  // Export to window
  window.attachDepthCard = attachDepthCard;
  window.initDepthCard = initDepthCard;
})();
