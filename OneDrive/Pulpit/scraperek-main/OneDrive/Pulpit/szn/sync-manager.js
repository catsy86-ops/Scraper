/**
 * sync-manager.js — Data sync & backup for Szczecin Guide
 * Provides export/import of user data (favorites, reviews, settings)
 * and optional cloud sync via URL-encoded sharing.
 */
'use strict';

const SyncManager = (() => {
  const KEYS = {
    favorites: 'lucznicza_favs',
    routeFavs: 'lucznicza_route_favs',
    theme: 'lucznicza_theme',
    searchHistory: 'search_history',
  };

  // Collect all user data
  function exportData() {
    const data = {
      version: 2,
      exported: new Date().toISOString(),
      favorites: safeGet(KEYS.favorites),
      routeFavs: safeGet(KEYS.routeFavs),
      theme: localStorage.getItem(KEYS.theme),
      searchHistory: safeGet(KEYS.searchHistory),
      reviews: getAllReviews(),
    };
    return data;
  }

  // Import user data
  function importData(data) {
    if (!data || data.version < 1) {
      throw new Error('Nieprawidłowy format danych');
    }
    if (data.favorites) localStorage.setItem(KEYS.favorites, JSON.stringify(data.favorites));
    if (data.routeFavs) localStorage.setItem(KEYS.routeFavs, JSON.stringify(data.routeFavs));
    if (data.theme) localStorage.setItem(KEYS.theme, data.theme);
    if (data.searchHistory) localStorage.setItem(KEYS.searchHistory, JSON.stringify(data.searchHistory));
    if (data.reviews) {
      Object.entries(data.reviews).forEach(([key, val]) => {
        localStorage.setItem(key, JSON.stringify(val));
      });
    }
    return true;
  }

  // Export as downloadable JSON file
  function downloadBackup() {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `niebuszewo-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (typeof showToast === 'function') showToast('💾 Backup pobrany!');
  }

  // Import from file
  function uploadBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        importData(data);
        if (typeof showToast === 'function') showToast('✅ Dane przywrócone z backupu!');
        // Refresh UI
        setTimeout(() => location.reload(), 1000);
      } catch (err) {
        if (typeof showToast === 'function') showToast('❌ Błąd importu: ' + err.message);
      }
    };
    input.click();
  }

  // Share data via URL (compact, base64-encoded)
  function shareViaUrl() {
    const data = exportData();
    // Only share favorites and route favs (compact)
    const compact = {
      f: data.favorites || [],
      r: data.routeFavs || [],
    };
    const encoded = btoa(JSON.stringify(compact));
    const url = `${location.origin}${location.pathname}?sync=${encoded}`;
    
    if (navigator.share) {
      navigator.share({ title: 'Moje ulubione — Niebuszewo Guide', url });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        if (typeof showToast === 'function') showToast('🔗 Link do synchronizacji skopiowany!');
      });
    }
  }

  // Check URL for sync data on load
  function checkUrlSync() {
    const params = new URLSearchParams(location.search);
    const syncData = params.get('sync');
    if (!syncData) return;

    try {
      const compact = JSON.parse(atob(syncData));
      if (compact.f) localStorage.setItem(KEYS.favorites, JSON.stringify(compact.f));
      if (compact.r) localStorage.setItem(KEYS.routeFavs, JSON.stringify(compact.r));
      if (typeof showToast === 'function') showToast('✅ Ulubione zsynchronizowane!');
      // Clean URL
      history.replaceState(null, '', location.pathname + location.hash);
    } catch (e) {
      console.warn('Sync URL parse failed:', e);
    }
  }

  // Helpers
  function safeGet(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
  }

  function getAllReviews() {
    const reviews = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('lucznicza_reviews_')) {
        reviews[key] = safeGet(key);
      }
    }
    return Object.keys(reviews).length ? reviews : null;
  }

  // Auto-check URL sync on load
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(checkUrlSync, 1000);
  });

  return {
    exportData,
    importData,
    downloadBackup,
    uploadBackup,
    shareViaUrl,
    checkUrlSync
  };
})();

window.SyncManager = SyncManager;
