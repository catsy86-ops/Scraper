/**
 * search.js — Globalna wyszukiwarka aplikacji
 * Przeszukuje: miejsca, trasy, wydarzenia, transport, info
 * Skrót: Ctrl+K lub przycisk lupy w headerze
 */
'use strict';

const SEARCH_STATE = {
  open: false,
  query: '',
  timeout: null,
  history: []
};

const HISTORY_KEY = 'search_history';

function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}
function addToHistory(q) {
  if (!q.trim()) return;
  let h = getHistory().filter(x => x !== q);
  h.unshift(q);
  h = h.slice(0, 8);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
}

// ===== BUILD SEARCH OVERLAY =====
function buildGlobalSearch() {
  if (document.getElementById('globalSearch')) return;

  const overlay = document.createElement('div');
  overlay.id = 'globalSearch';
  overlay.className = 'gs-overlay hidden';
  overlay.innerHTML = `
    <div class="gs-modal">
      <div class="gs-header">
        <span class="gs-icon">🔍</span>
        <input type="text" id="gsInput" class="gs-input"
          placeholder="Szukaj miejsc, tras, wydarzeń, transportu..."
          autocomplete="off" autocorrect="off" spellcheck="false" />
        <kbd class="gs-esc">Esc</kbd>
        <button class="gs-close" id="gsClose">✕</button>
      </div>
      <div class="gs-body" id="gsBody">
        <div class="gs-section" id="gsHistory"></div>
        <div class="gs-section" id="gsResults"></div>
      </div>
      <div class="gs-footer">
        <span>↑↓ nawigacja</span>
        <span>Enter otwórz</span>
        <span>Esc zamknij</span>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const input = document.getElementById('gsInput');
  const body  = document.getElementById('gsBody');

  // Close on overlay click
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeGlobalSearch();
  });
  document.getElementById('gsClose').addEventListener('click', closeGlobalSearch);

  // Input handler
  input.addEventListener('input', () => {
    const q = input.value.trim();
    SEARCH_STATE.query = q;
    clearTimeout(SEARCH_STATE.timeout);
    if (!q) { renderHistory(); return; }
    SEARCH_STATE.timeout = setTimeout(() => runSearch(q), 200);
  });

  // Keyboard navigation
  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeGlobalSearch(); return; }
    if (e.key === 'Enter') {
      const active = body.querySelector('.gs-item.active');
      if (active) active.click();
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      navigateResults(e.key === 'ArrowDown' ? 1 : -1);
    }
  });

  renderHistory();
}

function openGlobalSearch() {
  buildGlobalSearch();
  const overlay = document.getElementById('globalSearch');
  const input   = document.getElementById('gsInput');
  overlay.classList.remove('hidden');
  requestAnimationFrame(() => overlay.classList.add('visible'));
  setTimeout(() => input.focus(), 100);
  SEARCH_STATE.open = true;
  renderHistory();
}

function closeGlobalSearch() {
  const overlay = document.getElementById('globalSearch');
  if (!overlay) return;
  overlay.classList.remove('visible');
  setTimeout(() => overlay.classList.add('hidden'), 300);
  SEARCH_STATE.open = false;
}

// ===== SEARCH ENGINE =====
function runSearch(q) {
  const ql = q.toLowerCase();
  const results = [];

  // 1. Places
  (APP_DATA?.places || []).forEach(p => {
    const score = scoreMatch(ql, [p.name, p.addr, p.desc, ...(p.tags||[])]);
    if (score > 0) results.push({
      type: 'place', score, icon: p.emoji,
      title: p.name, sub: p.addr,
      badge: p.cat, badgeColor: getBadgeColor(p.cat),
      action: () => { closeGlobalSearch(); flyToPlace(p.id); }
    });
  });

  // 2. Routes
  (APP_DATA?.routes || []).forEach(r => {
    const score = scoreMatch(ql, [r.name, r.desc, ...(r.tags||[])]);
    if (score > 0) results.push({
      type: 'route', score, icon: r.emoji,
      title: r.name, sub: `${r.distance} · ${r.time}`,
      badge: r.type, badgeColor: r.color,
      action: () => { closeGlobalSearch(); navigateTo('routes'); setTimeout(() => showRouteOnMap(r.id), 300); }
    });
  });

  // 3. Events
  (APP_DATA?.events || []).forEach(ev => {
    const score = scoreMatch(ql, [ev.name, ev.place, ev.desc, ev.tag]);
    if (score > 0) results.push({
      type: 'event', score, icon: '🎉',
      title: ev.name, sub: `${ev.day} ${ev.month} · ${ev.place}`,
      badge: ev.tag, badgeColor: '#6c63ff',
      action: () => { closeGlobalSearch(); navigateTo('events'); }
    });
  });

  // 4. Transport
  (APP_DATA?.transport || []).forEach(t => {
    const lineNums = t.lines.map(l => l.num).join(' ');
    const score = scoreMatch(ql, [t.title, t.subtitle, lineNums, ...t.stops.map(s => s.name)]);
    if (score > 0) results.push({
      type: 'transport', score, icon: t.icon,
      title: t.title, sub: t.stops.map(s => s.name).join(', '),
      badge: 'transport', badgeColor: t.color,
      action: () => { closeGlobalSearch(); navigateTo('transport'); }
    });
  });

  // 5. Info sections
  (APP_DATA?.info || []).forEach(item => {
    const score = scoreMatch(ql, [item.title, item.text, ...(item.facts||[])]);
    if (score > 0) results.push({
      type: 'info', score, icon: item.icon,
      title: item.title, sub: item.text.substring(0, 60) + '...',
      badge: 'info', badgeColor: item.color,
      action: () => { closeGlobalSearch(); navigateTo('info'); }
    });
  });

  // Sort by score desc
  results.sort((a, b) => b.score - a.score);

  renderResults(q, results.slice(0, 12));
}

function scoreMatch(query, fields) {
  let score = 0;
  const words = query.split(/\s+/).filter(Boolean);
  fields.forEach(f => {
    if (!f) return;
    const fl = f.toLowerCase();
    if (fl === query) score += 100;
    else if (fl.startsWith(query)) score += 50;
    else if (fl.includes(query)) score += 30;
    words.forEach(w => { if (fl.includes(w)) score += 10; });
  });
  return score;
}

function getBadgeColor(cat) {
  const colors = { sport:'#ff6b6b', food:'#ffd93d', shop:'#6bcb77', park:'#4ecdc4', service:'#a29bfe', edu:'#fd79a8' };
  return colors[cat] || '#6c63ff';
}

// ===== RENDER =====
function renderHistory() {
  const histEl = document.getElementById('gsHistory');
  const resEl  = document.getElementById('gsResults');
  if (!histEl || !resEl) return;
  resEl.innerHTML = '';

  const history = getHistory();
  if (!history.length) {
    histEl.innerHTML = `<div class="gs-empty">🔍 Zacznij pisać aby wyszukać...</div>`;
    return;
  }

  histEl.innerHTML = `
    <div class="gs-section-title">🕐 Ostatnie wyszukiwania</div>
    ${history.map(h => `
      <div class="gs-item gs-history-item" onclick="fillSearch('${h.replace(/'/g,"\\'")}')">
        <span class="gs-item-icon">🕐</span>
        <span class="gs-item-title">${h}</span>
        <span class="gs-item-arrow">→</span>
      </div>
    `).join('')}
    <button class="gs-clear-history" onclick="clearSearchHistory()">🗑️ Wyczyść historię</button>
  `;
}

function renderResults(q, results) {
  const histEl = document.getElementById('gsHistory');
  const resEl  = document.getElementById('gsResults');
  if (!histEl || !resEl) return;
  histEl.innerHTML = '';

  if (!results.length) {
    resEl.innerHTML = `
      <div class="gs-empty">
        <div style="font-size:32px;margin-bottom:8px">🔍</div>
        <div>Brak wyników dla "<strong>${q}</strong>"</div>
        <div style="font-size:12px;color:var(--text3);margin-top:4px">Spróbuj innej frazy</div>
      </div>`;
    return;
  }

  const typeLabels = { place:'Miejsca', route:'Trasy', event:'Wydarzenia', transport:'Transport', info:'Informacje' };
  const grouped = {};
  results.forEach(r => { (grouped[r.type] = grouped[r.type] || []).push(r); });

  resEl.innerHTML = Object.entries(grouped).map(([type, items]) => `
    <div class="gs-section-title">${typeLabels[type] || type}</div>
    ${items.map((item, i) => `
      <div class="gs-item" tabindex="0" onclick="handleSearchResult(${JSON.stringify(i)}, '${type}', '${q}')">
        <span class="gs-item-icon">${item.icon}</span>
        <div class="gs-item-body">
          <div class="gs-item-title">${highlightMatch(item.title, q)}</div>
          <div class="gs-item-sub">${item.sub}</div>
        </div>
        <span class="gs-item-badge" style="background:${item.badgeColor}22;color:${item.badgeColor}">${item.badge}</span>
      </div>
    `).join('')}
  `).join('');

  // Store actions for click handling
  window._searchResults = results;
}

window.handleSearchResult = function(idx, type, q) {
  const results = window._searchResults || [];
  // Find by type and index within type
  const typeItems = results.filter(r => r.type === type);
  const item = typeItems[idx] || results[idx];
  if (item?.action) {
    addToHistory(q);
    item.action();
  }
};

window.fillSearch = function(q) {
  const input = document.getElementById('gsInput');
  if (input) { input.value = q; input.dispatchEvent(new Event('input')); input.focus(); }
};

window.clearSearchHistory = function() {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
};

function highlightMatch(text, q) {
  if (!q) return text;
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(re, '<mark>$1</mark>');
}

function navigateResults(dir) {
  const items = document.querySelectorAll('#gsBody .gs-item');
  if (!items.length) return;
  const active = document.querySelector('#gsBody .gs-item.active');
  let idx = active ? Array.from(items).indexOf(active) + dir : (dir > 0 ? 0 : items.length - 1);
  idx = Math.max(0, Math.min(items.length - 1, idx));
  items.forEach(i => i.classList.remove('active'));
  items[idx].classList.add('active');
  items[idx].scrollIntoView({ block: 'nearest' });
}

// ===== KEYBOARD SHORTCUT =====
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    SEARCH_STATE.open ? closeGlobalSearch() : openGlobalSearch();
  }
  if (e.key === 'Escape' && SEARCH_STATE.open) closeGlobalSearch();
});

// ===== WIRE UP HEADER SEARCH BUTTON =====
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('searchBtn');
  if (btn) {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      openGlobalSearch();
    });
  }
});

window.globalSearch = { open: openGlobalSearch, close: closeGlobalSearch };
