/**
 * user-profile.js — Personalizacja i gamifikacja
 * Profil użytkownika, odznaki, statystyki aktywności
 * Wszystko w localStorage — bez backendu
 */
'use strict';

const PROFILE_KEY  = 'user_profile';
const VISITED_KEY  = 'visited_places';
const ACTIVITY_KEY = 'user_activity';

// ===== PROFILE =====
function getProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}');
  } catch { return {}; }
}

function saveProfile(data) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...getProfile(), ...data }));
}

// ===== VISITED PLACES =====
function getVisited() {
  try { return JSON.parse(localStorage.getItem(VISITED_KEY) || '[]'); } catch { return []; }
}

function markVisited(placeId) {
  const visited = getVisited();
  if (!visited.includes(placeId)) {
    visited.push(placeId);
    localStorage.setItem(VISITED_KEY, JSON.stringify(visited));
    checkBadges(visited);
    updateActivityStats('visit');
  }
}

// ===== ACTIVITY STATS =====
function getActivity() {
  try { return JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '{"visits":0,"routes":0,"searches":0,"days":0,"lastVisit":null}'); } catch { return {}; }
}

function updateActivityStats(type) {
  const a = getActivity();
  if (type === 'visit')  a.visits  = (a.visits  || 0) + 1;
  if (type === 'route')  a.routes  = (a.routes  || 0) + 1;
  if (type === 'search') a.searches = (a.searches || 0) + 1;

  const today = new Date().toDateString();
  if (a.lastVisit !== today) {
    a.days = (a.days || 0) + 1;
    a.lastVisit = today;
  }
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(a));
}

// ===== BADGES =====
const BADGES = [
  { id: 'first_visit',    icon: '🏅', name: 'Pierwszy krok',      desc: 'Odwiedź pierwsze miejsce',          check: (v, a) => v.length >= 1 },
  { id: 'explorer_5',     icon: '🗺️', name: 'Odkrywca',           desc: 'Odwiedź 5 miejsc',                  check: (v, a) => v.length >= 5 },
  { id: 'explorer_10',    icon: '🌟', name: 'Eksplorator',         desc: 'Odwiedź 10 miejsc',                 check: (v, a) => v.length >= 10 },
  { id: 'explorer_all',   icon: '🏆', name: 'Mistrz Niebuszewo',   desc: 'Odwiedź wszystkie miejsca',         check: (v, a) => v.length >= (APP_DATA?.places?.length || 45) },
  { id: 'regular_3',      icon: '📅', name: 'Stały bywalec',       desc: 'Odwiedź aplikację 3 dni z rzędu',   check: (v, a) => (a.days || 0) >= 3 },
  { id: 'regular_7',      icon: '🔥', name: 'Tygodniowy streak',   desc: 'Odwiedź aplikację 7 dni z rzędu',   check: (v, a) => (a.days || 0) >= 7 },
  { id: 'route_runner',   icon: '🏃', name: 'Biegacz',             desc: 'Uruchom 3 trasy',                   check: (v, a) => (a.routes || 0) >= 3 },
  { id: 'searcher',       icon: '🔍', name: 'Detektyw',            desc: 'Wyszukaj 10 razy',                  check: (v, a) => (a.searches || 0) >= 10 },
];

function getEarnedBadges() {
  try { return JSON.parse(localStorage.getItem('earned_badges') || '[]'); } catch { return []; }
}

function checkBadges(visited) {
  const activity = getActivity();
  const earned = getEarnedBadges();
  const newBadges = [];

  BADGES.forEach(badge => {
    if (!earned.includes(badge.id) && badge.check(visited, activity)) {
      earned.push(badge.id);
      newBadges.push(badge);
    }
  });

  if (newBadges.length) {
    localStorage.setItem('earned_badges', JSON.stringify(earned));
    newBadges.forEach(b => {
      setTimeout(() => showBadgeNotification(b), 500);
    });
  }
}

function showBadgeNotification(badge) {
  const notif = document.createElement('div');
  notif.className = 'badge-notif';
  notif.innerHTML = `
    <div class="bn-icon">${badge.icon}</div>
    <div class="bn-body">
      <div class="bn-title">🏅 Nowa odznaka!</div>
      <div class="bn-name">${badge.name}</div>
      <div class="bn-desc">${badge.desc}</div>
    </div>
  `;
  document.body.appendChild(notif);
  requestAnimationFrame(() => notif.classList.add('visible'));
  setTimeout(() => {
    notif.classList.remove('visible');
    setTimeout(() => notif.remove(), 500);
  }, 4000);
}

// ===== PROFILE PANEL =====
function buildProfilePanel() {
  if (document.getElementById('profilePanel')) return;

  const panel = document.createElement('div');
  panel.id = 'profilePanel';
  panel.className = 'profile-panel hidden';
  document.body.appendChild(panel);
  renderProfilePanel();
}

function renderProfilePanel() {
  const panel = document.getElementById('profilePanel');
  if (!panel) return;

  const profile  = getProfile();
  const visited  = getVisited();
  const activity = getActivity();
  const earned   = getEarnedBadges();
  const allBadges = BADGES.map(b => ({ ...b, earned: earned.includes(b.id) }));

  const visitedPlaces = (APP_DATA?.places || []).filter(p => visited.includes(p.id));
  const totalPlaces = APP_DATA?.places?.length || 45;
  const pct = Math.round((visited.length / totalPlaces) * 100);

  panel.innerHTML = `
    <div class="pp-overlay" onclick="closeProfilePanel()"></div>
    <div class="pp-modal">
      <div class="pp-header">
        <div class="pp-avatar">${profile.avatar || '🏹'}</div>
        <div class="pp-info">
          <div class="pp-name">${profile.name || 'Mieszkaniec Niebuszewo'}</div>
          <div class="pp-sub">Szczecin · Niebuszewo</div>
        </div>
        <button class="pp-close" onclick="closeProfilePanel()">✕</button>
      </div>

      <!-- Progress -->
      <div class="pp-section">
        <div class="pp-section-title">📍 Odkryte miejsca</div>
        <div class="pp-progress-wrap">
          <div class="pp-progress-bar" style="width:${pct}%"></div>
        </div>
        <div class="pp-progress-label">${visited.length} / ${totalPlaces} miejsc (${pct}%)</div>
      </div>

      <!-- Stats -->
      <div class="pp-stats">
        <div class="pp-stat"><span class="pp-stat-num">${visited.length}</span><span class="pp-stat-label">Odwiedzonych</span></div>
        <div class="pp-stat"><span class="pp-stat-num">${activity.routes || 0}</span><span class="pp-stat-label">Tras</span></div>
        <div class="pp-stat"><span class="pp-stat-num">${activity.days || 0}</span><span class="pp-stat-label">Dni aktywności</span></div>
        <div class="pp-stat"><span class="pp-stat-num">${earned.length}</span><span class="pp-stat-label">Odznak</span></div>
      </div>

      <!-- Badges -->
      <div class="pp-section">
        <div class="pp-section-title">🏅 Odznaki</div>
        <div class="pp-badges">
          ${allBadges.map(b => `
            <div class="pp-badge ${b.earned ? 'earned' : 'locked'}" title="${b.name}: ${b.desc}">
              <div class="pp-badge-icon">${b.earned ? b.icon : '🔒'}</div>
              <div class="pp-badge-name">${b.name}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Recently visited -->
      ${visitedPlaces.length ? `
        <div class="pp-section">
          <div class="pp-section-title">🕐 Ostatnio odwiedzone</div>
          <div class="pp-visited-list">
            ${visitedPlaces.slice(-5).reverse().map(p => `
              <div class="pp-visited-item" onclick="flyToPlace(${p.id});closeProfilePanel()">
                <span>${p.emoji}</span>
                <span>${p.name}</span>
                <span class="pp-visited-cat badge-${p.cat}">${p.cat}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Edit name -->
      <div class="pp-section">
        <div class="pp-section-title">✏️ Twój profil</div>
        <div class="pp-edit-row">
          <input type="text" id="ppNameInput" class="pp-name-input"
            placeholder="Twoje imię lub pseudonim"
            value="${profile.name || ''}" maxlength="30" />
          <button class="pp-save-btn" onclick="saveProfileName()">Zapisz</button>
        </div>
        <div class="pp-avatar-row">
          ${['🏹','🏃','🚴','🌳','🍕','📚','⚽','🎯','🦁','🐺'].map(a => `
            <button class="pp-avatar-opt ${(profile.avatar||'🏹')===a?'active':''}"
              onclick="setAvatar('${a}')">${a}</button>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

window.saveProfileName = function() {
  const input = document.getElementById('ppNameInput');
  if (input) {
    saveProfile({ name: input.value.trim() || 'Mieszkaniec Niebuszewo' });
    showToast('✅ Profil zapisany');
    renderProfilePanel();
  }
};

window.setAvatar = function(emoji) {
  saveProfile({ avatar: emoji });
  renderProfilePanel();
};

window.openProfilePanel = function() {
  buildProfilePanel();
  const panel = document.getElementById('profilePanel');
  if (panel) {
    panel.classList.remove('hidden');
    requestAnimationFrame(() => panel.classList.add('visible'));
  }
};

window.closeProfilePanel = function() {
  const panel = document.getElementById('profilePanel');
  if (panel) {
    panel.classList.remove('visible');
    setTimeout(() => panel.classList.add('hidden'), 300);
  }
};

// ===== HOOK INTO APP =====
// Mark place as visited when modal opens
const _origOpenPlaceModal = window.openPlaceModal;
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (typeof openPlaceModal === 'function') {
      const orig = openPlaceModal;
      window.openPlaceModal = function(id) {
        orig(id);
        markVisited(id);
      };
    }
    // Add profile button to sidebar
    const sidebarFooter = document.querySelector('.sidebar-footer');
    if (sidebarFooter) {
      const btn = document.createElement('button');
      btn.className = 'profile-sidebar-btn';
      btn.innerHTML = '🏅 Mój profil';
      btn.addEventListener('click', openProfilePanel);
      sidebarFooter.insertBefore(btn, sidebarFooter.firstChild);
    }
    // Update activity on load
    updateActivityStats('visit');
  }, 1000);
});

window.userProfile = { getProfile, getVisited, markVisited, getActivity, updateActivityStats };
