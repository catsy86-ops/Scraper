/**
 * pwa.js — PWA Install Banner + Service Worker registration
 * Handles beforeinstallprompt, shows custom install UI,
 * registers SW for offline support.
 */
'use strict';

// ===== PWA INSTALL BANNER =====
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  // Show banner after 3 seconds if not already installed
  if (!localStorage.getItem('pwaInstalled') && !localStorage.getItem('pwaDismissed')) {
    setTimeout(showInstallBanner, 3000);
  }
});

window.addEventListener('appinstalled', () => {
  localStorage.setItem('pwaInstalled', '1');
  hideInstallBanner();
  if (typeof showToast === 'function') showToast('✅ Aplikacja zainstalowana na ekranie głównym!');
});

function showInstallBanner() {
  if (document.getElementById('pwaBanner')) return;
  const banner = document.createElement('div');
  banner.id = 'pwaBanner';
  banner.className = 'pwa-banner';
  banner.innerHTML = `
    <div class="pwa-banner-icon">🏹</div>
    <div class="pwa-banner-text">
      <div class="pwa-banner-title">Zainstaluj aplikację</div>
      <div class="pwa-banner-sub">Dodaj do ekranu głównego — działa offline</div>
    </div>
    <button class="pwa-banner-install" id="pwaInstallBtn">Zainstaluj</button>
    <button class="pwa-banner-close" id="pwaDismissBtn" aria-label="Zamknij">✕</button>
  `;
  document.body.appendChild(banner);
  // Animate in
  requestAnimationFrame(() => banner.classList.add('visible'));

  document.getElementById('pwaInstallBtn').addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (outcome === 'accepted') {
      localStorage.setItem('pwaInstalled', '1');
    }
    hideInstallBanner();
  });

  document.getElementById('pwaDismissBtn').addEventListener('click', () => {
    localStorage.setItem('pwaDismissed', '1');
    hideInstallBanner();
  });
}

function hideInstallBanner() {
  const banner = document.getElementById('pwaBanner');
  if (!banner) return;
  banner.classList.remove('visible');
  setTimeout(() => banner.remove(), 400);
}

// ===== SERVICE WORKER REGISTRATION =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('✅ SW registered:', reg.scope);
        // Check for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateBanner();
            }
          });
        });
      })
      .catch(err => console.warn('SW registration failed:', err));
  });
}

function showUpdateBanner() {
  if (document.getElementById('pwaUpdateBanner')) return;
  const banner = document.createElement('div');
  banner.id = 'pwaUpdateBanner';
  banner.className = 'pwa-update-banner';
  banner.innerHTML = `
    <span>🔄 Dostępna nowa wersja aplikacji</span>
    <button onclick="window.location.reload()">Odśwież</button>
    <button onclick="this.parentElement.remove()">✕</button>
  `;
  document.body.appendChild(banner);
}

// ===== ONLINE/OFFLINE STATUS =====
function updateOnlineStatus() {
  const isOnline = navigator.onLine;
  if (!isOnline) {
    if (typeof showToast === 'function') showToast('📵 Tryb offline — dane mogą być nieaktualne');
    document.body.classList.add('offline');
  } else {
    document.body.classList.remove('offline');
  }
}

window.addEventListener('online',  updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
