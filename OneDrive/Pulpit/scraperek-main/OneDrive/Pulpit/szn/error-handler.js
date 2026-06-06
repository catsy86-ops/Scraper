/**
 * error-handler.js — Global error boundary for Szczecin Guide
 * Catches unhandled errors and promise rejections, shows user-friendly messages.
 */
'use strict';

const ErrorHandler = (() => {
  const errors = [];
  const MAX_ERRORS = 50;

  // Track errors for debugging
  function logError(type, message, source, line, col, error) {
    const entry = {
      type,
      message: String(message).substring(0, 200),
      source: source || '',
      line: line || 0,
      col: col || 0,
      stack: error?.stack?.substring(0, 500) || '',
      timestamp: new Date().toISOString()
    };
    errors.push(entry);
    if (errors.length > MAX_ERRORS) errors.shift();
    return entry;
  }

  // Determine if error is critical (should show user notification)
  function isCritical(message) {
    const critical = ['initMap', 'initUI', 'initLive', 'APP_DATA', 'Leaflet'];
    return critical.some(k => message.includes(k));
  }

  // Show error toast (non-blocking)
  function notifyUser(entry) {
    if (typeof showToast === 'function') {
      if (isCritical(entry.message)) {
        showToast('⚠️ Wystąpił błąd — niektóre funkcje mogą nie działać');
      }
    }
  }

  // Global error handler
  window.addEventListener('error', (e) => {
    // Ignore third-party script errors (CORS)
    if (e.message === 'Script error.' && !e.filename) return;
    // Ignore known noisy errors
    if (e.message?.includes('ResizeObserver') || e.message?.includes('Loading chunk')) return;

    const entry = logError('error', e.message, e.filename, e.lineno, e.colno, e.error);
    console.error('🔴 Error:', entry.message, entry.source ? `(${entry.source}:${entry.line})` : '');
    notifyUser(entry);
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (e) => {
    const msg = e.reason?.message || String(e.reason);
    // Ignore network errors (handled by individual fetch calls)
    if (msg.includes('fetch') || msg.includes('NetworkError') || msg.includes('AbortError')) return;

    const entry = logError('rejection', msg, '', 0, 0, e.reason);
    console.warn('🟡 Unhandled rejection:', entry.message);
    notifyUser(entry);
  });

  // Get error log (for debugging)
  function getLog() {
    return [...errors];
  }

  // Clear error log
  function clear() {
    errors.length = 0;
  }

  return { getLog, clear };
})();

window.ErrorHandler = ErrorHandler;
