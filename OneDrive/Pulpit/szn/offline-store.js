/**
 * offline-store.js — IndexedDB wrapper for offline data persistence
 * Stores API responses locally so the app works without internet.
 * 
 * Usage:
 *   await OfflineStore.set('weather', data);
 *   const cached = await OfflineStore.get('weather');
 */
'use strict';

const OfflineStore = (() => {
  const DB_NAME = 'niebuszewo-guide-db';
  const DB_VERSION = 1;
  const STORE_NAME = 'api-cache';

  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB not supported'));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return dbPromise;
  }

  async function set(key, data, ttlMs = 30 * 60 * 1000) {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({
        key,
        data,
        timestamp: Date.now(),
        expires: Date.now() + ttlMs
      });
      return new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('OfflineStore.set failed:', e);
    }
  }

  async function get(key, ignoreExpiry = false) {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const result = request.result;
          if (!result) { resolve(null); return; }
          // Check expiry
          if (!ignoreExpiry && result.expires < Date.now()) {
            resolve(null); // expired
            return;
          }
          resolve(result.data);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn('OfflineStore.get failed:', e);
      return null;
    }
  }

  // Get data even if expired (for offline fallback)
  async function getStale(key) {
    return get(key, true);
  }

  async function remove(key) {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(key);
    } catch (e) {
      console.warn('OfflineStore.remove failed:', e);
    }
  }

  async function clear() {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
    } catch (e) {
      console.warn('OfflineStore.clear failed:', e);
    }
  }

  // Clean up expired entries
  async function cleanup() {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('timestamp');
      const request = index.openCursor();
      request.onsuccess = (e) => {
        const cursor = e.target.result;
        if (!cursor) return;
        if (cursor.value.expires < Date.now()) {
          cursor.delete();
        }
        cursor.continue();
      };
    } catch (e) {
      console.warn('OfflineStore.cleanup failed:', e);
    }
  }

  return { set, get, getStale, remove, clear, cleanup };
})();

// Export for use in other modules
window.OfflineStore = OfflineStore;

// Cleanup expired entries on load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => OfflineStore.cleanup(), 5000);
});
