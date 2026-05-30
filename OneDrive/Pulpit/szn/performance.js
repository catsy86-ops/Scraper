/**
 * performance.js — Performance monitoring & network status for Szczecin Guide
 * Tracks load times, API response times, and shows network status indicator.
 */
'use strict';

const PerfMonitor = (() => {
  const metrics = {
    pageLoad: 0,
    firstPaint: 0,
    apiCalls: [],
    errors: 0
  };

  // Track page load performance
  function init() {
    if (window.performance && performance.timing) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const timing = performance.timing;
          metrics.pageLoad = timing.loadEventEnd - timing.navigationStart;
          metrics.firstPaint = timing.domContentLoadedEventEnd - timing.navigationStart;
          console.log(`⚡ Page load: ${metrics.pageLoad}ms | DOM ready: ${metrics.firstPaint}ms`);
        }, 100);
      });
    }

    // Track Core Web Vitals if available
    if ('PerformanceObserver' in window) {
      const supported = PerformanceObserver.supportedEntryTypes || [];

      // Largest Contentful Paint
      if (supported.includes('largest-contentful-paint')) {
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            metrics.lcp = Math.round(lastEntry.startTime);
          });
          lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        } catch (e) { /* not supported */ }
      }

      // First Input Delay
      if (supported.includes('first-input')) {
        try {
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            if (entries.length) {
              metrics.fid = Math.round(entries[0].processingStart - entries[0].startTime);
            }
          });
          fidObserver.observe({ type: 'first-input', buffered: true });
        } catch (e) { /* not supported */ }
      }

      // Cumulative Layout Shift (Chromium only — Firefox doesn't support it)
      if (supported.includes('layout-shift')) {
        try {
          let clsValue = 0;
          const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            }
            metrics.cls = Math.round(clsValue * 1000) / 1000;
          });
          clsObserver.observe({ type: 'layout-shift', buffered: true });
        } catch (e) { /* not supported */ }
      }
    }

    initNetworkStatus();
  }

  // Track API call performance
  function trackApiCall(name, startTime) {
    const duration = Date.now() - startTime;
    metrics.apiCalls.push({ name, duration, timestamp: Date.now() });
    // Keep only last 20 calls
    if (metrics.apiCalls.length > 20) metrics.apiCalls.shift();
    return duration;
  }

  // Network status indicator
  function initNetworkStatus() {
    const indicator = document.createElement('div');
    indicator.id = 'networkStatus';
    indicator.className = 'network-status';
    indicator.setAttribute('aria-live', 'polite');
    indicator.setAttribute('role', 'status');
    document.body.appendChild(indicator);

    function updateStatus() {
      const online = navigator.onLine;
      indicator.className = `network-status ${online ? 'online' : 'offline'}`;
      indicator.innerHTML = online
        ? ''
        : '<span class="ns-icon">📵</span><span class="ns-text">Offline</span>';
      
      if (!online) {
        indicator.style.display = 'flex';
      } else {
        // Show briefly then hide
        indicator.style.display = 'none';
      }
    }

    window.addEventListener('online', () => {
      updateStatus();
      if (typeof showToast === 'function') showToast('✅ Połączenie przywrócone');
      // Refresh data when back online
      if (typeof fetchWeather === 'function') fetchWeather();
      if (typeof fetchAqi === 'function') fetchAqi();
    });

    window.addEventListener('offline', () => {
      updateStatus();
      if (typeof showToast === 'function') showToast('📵 Brak połączenia — tryb offline');
    });

    updateStatus();
  }

  // Get metrics summary
  function getMetrics() {
    return { ...metrics };
  }

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', init);

  return { trackApiCall, getMetrics };
})();

window.PerfMonitor = PerfMonitor;
