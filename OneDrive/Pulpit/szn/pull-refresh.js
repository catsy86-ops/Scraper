/**
 * pull-refresh.js — Pull-to-refresh for mobile devices
 * Adds native-feeling pull-down gesture to refresh live data.
 */
'use strict';

const PullRefresh = (() => {
  let startY = 0;
  let pulling = false;
  let indicator = null;
  const THRESHOLD = 80; // px to trigger refresh

  function init() {
    // Only on touch devices
    if (!('ontouchstart' in window)) return;

    // Create indicator element
    indicator = document.createElement('div');
    indicator.id = 'pullRefreshIndicator';
    indicator.className = 'pull-refresh-indicator';
    indicator.innerHTML = '<span class="pri-icon">↓</span><span class="pri-text">Pociągnij aby odświeżyć</span>';
    document.body.prepend(indicator);

    const main = document.querySelector('.main');
    if (!main) return;

    main.addEventListener('touchstart', onTouchStart, { passive: true });
    main.addEventListener('touchmove', onTouchMove, { passive: false });
    main.addEventListener('touchend', onTouchEnd, { passive: true });
  }

  function onTouchStart(e) {
    const main = document.querySelector('.main');
    // Only trigger if scrolled to top
    if (main && main.scrollTop <= 0) {
      startY = e.touches[0].clientY;
      pulling = true;
    }
  }

  function onTouchMove(e) {
    if (!pulling || !indicator) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;

    if (diff > 0 && diff < 150) {
      const progress = Math.min(diff / THRESHOLD, 1);
      indicator.style.transform = `translateY(${Math.min(diff * 0.5, 60)}px)`;
      indicator.style.opacity = progress;
      indicator.classList.toggle('ready', diff >= THRESHOLD);

      if (diff >= THRESHOLD) {
        indicator.querySelector('.pri-text').textContent = 'Puść aby odświeżyć';
        indicator.querySelector('.pri-icon').textContent = '↑';
      } else {
        indicator.querySelector('.pri-text').textContent = 'Pociągnij aby odświeżyć';
        indicator.querySelector('.pri-icon').textContent = '↓';
      }

      if (diff > 10) e.preventDefault();
    }
  }

  function onTouchEnd(e) {
    if (!pulling || !indicator) return;
    pulling = false;

    const wasReady = indicator.classList.contains('ready');
    indicator.style.transform = 'translateY(0)';
    indicator.style.opacity = '0';
    indicator.classList.remove('ready');

    if (wasReady) {
      doRefresh();
    }
  }

  function doRefresh() {
    if (typeof showToast === 'function') showToast('🔄 Odświeżanie danych...');

    // Refresh all live data
    const refreshPromises = [];
    if (typeof fetchWeather === 'function') {
      window.live && (window.live.lastWeatherFetch = 0);
      refreshPromises.push(fetchWeather());
    }
    if (typeof fetchAqi === 'function') {
      window.live && (window.live.lastAqiFetch = 0);
      refreshPromises.push(fetchAqi());
    }
    if (typeof generateTransportDepartures === 'function') {
      refreshPromises.push(generateTransportDepartures());
    }

    Promise.allSettled(refreshPromises).then(() => {
      if (typeof showToast === 'function') showToast('✅ Dane odświeżone');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(init, 1000);
  });

  return { doRefresh };
})();

window.PullRefresh = PullRefresh;
