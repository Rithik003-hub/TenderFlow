/**
 * AI Loader - Website Loading Animation Engine
 * Displays the rotating glowing circular aura with letter wave animation on page load/reload
 */

(function () {
  'use strict';

  function renderLoaderText(text = 'Loading') {
    const textContainer = document.getElementById('aiLoaderText');
    if (!textContainer) return;

    textContainer.innerHTML = '';
    const letters = text.split('');
    letters.forEach((letter, index) => {
      const span = document.createElement('span');
      span.className = 'ai-loader-letter';
      span.textContent = letter === ' ' ? '\u00A0' : letter;
      span.style.animationDelay = `${index * 0.1}s`;
      textContainer.appendChild(span);
    });
  }

  function hideLoader() {
    const overlay = document.getElementById('appLoader');
    if (overlay && !overlay.classList.contains('fade-out')) {
      overlay.classList.add('fade-out');
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 650);
    }
  }

  function showLoader(text = 'Loading', autoHideDelay = null) {
    const overlay = document.getElementById('appLoader');
    if (!overlay) return;

    renderLoaderText(text);
    overlay.style.display = 'flex';
    // Force layout reflow before removing class
    void overlay.offsetHeight;
    overlay.classList.remove('fade-out');

    if (autoHideDelay && autoHideDelay > 0) {
      setTimeout(hideLoader, autoHideDelay);
    }
  }

  // Initial execution on script evaluation (immediate feedback)
  const startTime = Date.now();
  const MIN_DISPLAY_TIME_MS = 900; // Shows the full animation rotation smoothly

  // Initial text setup
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      renderLoaderText('TenderFlow');
    });
  } else {
    renderLoaderText('TenderFlow');
  }

  // Dismiss on full window load (including fonts, canvas, background WebGL)
  window.addEventListener('load', () => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, MIN_DISPLAY_TIME_MS - elapsed);
    setTimeout(hideLoader, remaining);
  });

  // Safety fallback in case window.load is delayed by external assets
  setTimeout(hideLoader, 3000);

  // Global API
  window.showLoader = showLoader;
  window.hideLoader = hideLoader;
})();
