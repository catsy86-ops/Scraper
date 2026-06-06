/**
 * ux-enhancements.js — Przyjemne funkcje dla użytkownika
 * 1. Animowany splash z pogodą i powitaniem
 * 2. Konfetti przy zdobyciu odznaki
 * 3. "Zaskoczy mnie!" — losowe miejsce
 * 4. Animacje przejść między sekcjami
 * 5. "Dziś w dzielnicy" — widget na mapie
 * 6. Kolor temperatury na widgecie pogody
 * 7. "Przypomnij mi" dla wydarzeń
 * 8. Notatki do miejsc
 */
'use strict';

// ============================================================
// 1. ANIMOWANY SPLASH Z POGODĄ I POWITANIEM
// ============================================================

const TIPS = [
  '💡 Naciśnij Ctrl+K aby wyszukać cokolwiek',
  '🗺️ Kliknij prawym przyciskiem na mapie — menu kontekstowe',
  '🎯 Naciśnij L aby zlokalizować się na mapie',
  '❤️ Dodawaj miejsca do ulubionych klikając serce',
  '🏅 Odwiedzaj miejsca aby zdobywać odznaki',
  '🚶 Dołącz do trasy i umów spotkanie z innymi',
  '📅 Sprawdź sekcję "Na żywo" — prawdziwe dane ZDiTM',
  '🌙 Mapa automatycznie przełącza się na ciemny styl wieczorem',
  '📍 Kliknij na mapie aby skopiować współrzędne',
  '🔍 Wyszukiwarka przeszukuje miejsca, trasy i wydarzenia',
];

function initSplash() {
  const hour = new Date().getHours();

  // Greeting based on time of day
  const greetings = [
    { range: [5, 12],  text: 'Dzień dobry! ☀️',    bg: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)' },
    { range: [12, 17], text: 'Dobry dzień! 🌤️',    bg: 'linear-gradient(135deg,#0f3460 0%,#16213e 50%,#1a1a2e 100%)' },
    { range: [17, 21], text: 'Dobry wieczór! 🌅',   bg: 'linear-gradient(135deg,#2d1b69 0%,#11998e 100%)' },
    { range: [21, 24], text: 'Dobranoc! 🌙',        bg: 'linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 50%,#0d0d1a 100%)' },
    { range: [0, 5],   text: 'Nocna pora... 🌙',    bg: 'linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 50%,#0d0d1a 100%)' },
  ];

  const g = greetings.find(g => hour >= g.range[0] && hour < g.range[1]) || greetings[0];

  const greetEl = document.getElementById('splashGreeting');
  const bgEl    = document.getElementById('splashBg');
  const tipEl   = document.getElementById('splashTip');

  if (greetEl) greetEl.textContent = g.text;
  if (bgEl) bgEl.style.background = g.bg;
  if (tipEl) tipEl.textContent = TIPS[Math.floor(Math.random() * TIPS.length)];

  // Fetch weather for splash
  const LAT = 53.4530, LON = 14.5520;
  fetch(`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code&timezone=Europe/Warsaw`)
    .then(r => r.json())
    .then(data => {
      const temp = Math.round(data.current.temperature_2m);
      const code = data.current.weather_code;
      const WMO_ICONS = { 0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',51:'🌦️',61:'🌧️',71:'🌨️',80:'🌦️',95:'⛈️' };
      const icon = WMO_ICONS[code] || WMO_ICONS[Math.floor(code/10)*10] || '🌡️';

      const weatherRow = document.getElementById('splashWeather');
      const wIcon = document.getElementById('splashWeatherIcon');
      const wTemp = document.getElementById('splashWeatherTemp');
      const wDesc = document.getElementById('splashWeatherDesc');

      if (weatherRow) weatherRow.style.display = 'flex';
      if (wIcon) wIcon.textContent = icon;
      if (wTemp) wTemp.textContent = `${temp}°C`;
      if (wDesc) wDesc.textContent = 'Niebuszewo';

      // Update splash icon to weather icon
      const splashIcon = document.getElementById('splashIcon');
      if (splashIcon) splashIcon.textContent = icon;
    })
    .catch(() => {}); // silent fail — splash still works
}

// Call immediately
initSplash();

// ============================================================
// 2. KONFETTI PRZY ZDOBYCIU ODZNAKI
// ============================================================

function launchConfetti() {
  const canvas = document.createElement('canvas');
  canvas.id = 'confettiCanvas';
  canvas.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:none;';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const particles = [];
  const colors = ['#6c63ff','#ff6584','#43e97b','#ffd93d','#4ecdc4','#fd79a8','#ff6b6b','#a29bfe'];

  for (let i = 0; i < 120; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: -10 - Math.random() * 100,
      w: 6 + Math.random() * 8,
      h: 3 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 4,
      rot: Math.random() * 360,
      rotV: (Math.random() - 0.5) * 8,
      opacity: 1
    });
  }

  let frame = 0;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.rotV;
      p.vy += 0.08; // gravity
      if (frame > 80) p.opacity -= 0.015;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
      ctx.restore();
    });
    frame++;
    if (frame < 140) requestAnimationFrame(animate);
    else canvas.remove();
  }
  animate();
}

// Hook into badge notification
const _origShowBadge = window.showBadgeNotification;
window.showBadgeNotification = function(badge) {
  if (_origShowBadge) _origShowBadge(badge);
  launchConfetti();
};

// ============================================================
// 3. "ZASKOCZY MNIE!" — LOSOWE MIEJSCE
// ============================================================

function surpriseMe() {
  if (!APP_DATA?.places?.length) return;
  const visited = window.userProfile?.getVisited?.() || [];
  // Prefer unvisited places
  let pool = APP_DATA.places.filter(p => !visited.includes(p.id));
  if (!pool.length) pool = APP_DATA.places; // all visited — pick any
  const place = pool[Math.floor(Math.random() * pool.length)];
  if (typeof openPlaceModal === 'function') openPlaceModal(place.id);
  if (typeof showToast === 'function') showToast(`🎲 Losowe miejsce: ${place.name}`);
}

// Add button to places section toolbar
function addSurpriseButton() {
  const toolbar = document.querySelector('.places-toolbar .places-tools');
  if (!toolbar || document.getElementById('surpriseBtn')) return;
  const btn = document.createElement('button');
  btn.id = 'surpriseBtn';
  btn.className = 'places-tool-btn';
  btn.innerHTML = '🎲 Zaskoczy mnie!';
  btn.title = 'Losowe nieodwiedzone miejsce';
  btn.addEventListener('click', surpriseMe);
  toolbar.appendChild(btn);
}

// ============================================================
// 4. ANIMACJE PRZEJŚĆ MIĘDZY SEKCJAMI
// ============================================================

// Inject transition CSS once
const transitionStyle = document.createElement('style');
transitionStyle.textContent = `
  .section { animation: none; }
  .section.slide-in-right  { animation: slideInRight  0.28s cubic-bezier(0.4,0,0.2,1) both; }
  .section.slide-in-left   { animation: slideInLeft   0.28s cubic-bezier(0.4,0,0.2,1) both; }
  .section.slide-in-up     { animation: slideInUp2    0.28s cubic-bezier(0.4,0,0.2,1) both; }
  @keyframes slideInRight  { from { opacity:0; transform:translateX(24px); } to { opacity:1; transform:none; } }
  @keyframes slideInLeft   { from { opacity:0; transform:translateX(-24px); } to { opacity:1; transform:none; } }
  @keyframes slideInUp2    { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }
`;
document.head.appendChild(transitionStyle);

const SECTION_ORDER = ['map','places','routes','info','transport','events','live','community'];

function getSectionAnimation(from, to) {
  const fi = SECTION_ORDER.indexOf(from);
  const ti = SECTION_ORDER.indexOf(to);
  if (fi === -1 || ti === -1) return 'slide-in-up';
  return ti > fi ? 'slide-in-right' : 'slide-in-left';
}

// Wrap navigateTo to add animations
let _lastSection = 'map';
const _origNavigateTo = window.navigateTo;
window.navigateTo = function(section) {
  const anim = getSectionAnimation(_lastSection, section);
  _lastSection = section;
  if (typeof _origNavigateTo === 'function') _origNavigateTo(section);
  // Apply animation to newly active section
  requestAnimationFrame(() => {
    const el = document.getElementById(`section-${section}`);
    if (el) {
      el.classList.remove('slide-in-right','slide-in-left','slide-in-up');
      void el.offsetWidth; // reflow
      el.classList.add(anim);
    }
  });
};

// ============================================================
// 5. "DZIŚ W DZIELNICY" — WIDGET NA MAPIE
// ============================================================

function buildTodayWidget() {
  const mapEl = document.getElementById('map');
  if (!mapEl || document.getElementById('todayWidget')) return;

  const widget = document.createElement('div');
  widget.id = 'todayWidget';
  widget.className = 'today-widget';
  mapEl.appendChild(widget);
  updateTodayWidget();
  setInterval(updateTodayWidget, 60 * 1000);
}

function updateTodayWidget() {
  const widget = document.getElementById('todayWidget');
  if (!widget) return;

  const now = new Date();
  const todayStr = `${String(now.getDate()).padStart(2,'0')}.${String(now.getMonth()+1).padStart(2,'0')}`;

  // Count today's events
  const todayEvents = (APP_DATA?.events || []).filter(e => {
    const months = {CZE:6,LIP:7,SIE:8,MAJ:5,KWI:4,MAR:3,LUT:2,STY:1,WRZ:9,PAŹ:10,LIS:11,GRU:12};
    const m = months[e.month] || 0;
    return m === now.getMonth()+1 && parseInt(e.day) === now.getDate();
  });

  // Count route participants
  let totalParticipants = 0;
  if (window.routesMeetup) {
    (APP_DATA?.routes || []).forEach(r => {
      totalParticipants += window.routesMeetup.getJoined(r.id).length;
    });
  }

  // Count upcoming meetups today
  let todayMeetups = 0;
  if (window.routesMeetup) {
    (APP_DATA?.routes || []).forEach(r => {
      window.routesMeetup.getMeetups(r.id).forEach(m => {
        if (m.date === now.toISOString().split('T')[0]) todayMeetups++;
      });
    });
  }

  const items = [];
  if (todayEvents.length) items.push(`🎉 ${todayEvents.length} wydarzenie${todayEvents.length > 1 ? 'ń' : ''} dziś`);
  if (totalParticipants) items.push(`👥 ${totalParticipants} na trasach`);
  if (todayMeetups) items.push(`📅 ${todayMeetups} spotkanie${todayMeetups > 1 ? 'ń' : ''} dziś`);
  if (!items.length) items.push(`📍 ${APP_DATA?.places?.length || 45} miejsc w okolicy`);

  widget.innerHTML = `
    <div class="tw-date">${todayStr}</div>
    <div class="tw-items">
      ${items.map(i => `<div class="tw-item">${i}</div>`).join('')}
    </div>
  `;
}

// ============================================================
// 6. KOLOR TEMPERATURY NA WIDGECIE POGODY
// ============================================================

function applyTemperatureColor(temp) {
  const widget = document.getElementById('weatherWidget');
  if (!widget) return;

  let color, bg;
  if (temp <= 0)       { color = '#74b9ff'; bg = 'rgba(116,185,255,0.12)'; }
  else if (temp <= 8)  { color = '#a29bfe'; bg = 'rgba(162,155,254,0.12)'; }
  else if (temp <= 15) { color = '#55efc4'; bg = 'rgba(85,239,196,0.12)'; }
  else if (temp <= 22) { color = '#43e97b'; bg = 'rgba(67,233,123,0.12)'; }
  else if (temp <= 28) { color = '#ffd93d'; bg = 'rgba(255,217,61,0.12)'; }
  else if (temp <= 33) { color = '#fd79a8'; bg = 'rgba(253,121,168,0.12)'; }
  else                 { color = '#ff6b6b'; bg = 'rgba(255,107,107,0.12)'; }

  widget.style.borderColor = color;
  widget.style.background  = `rgba(15,15,26,0.92)`;
  widget.style.boxShadow   = `0 0 16px ${bg}`;

  const tempEl = document.getElementById('wTemp');
  if (tempEl) tempEl.style.color = color;
}

// Hook into weather widget render
const _origRenderWeatherWidget = window.renderWeatherWidget;
window.renderWeatherWidget = function(c) {
  if (_origRenderWeatherWidget) _origRenderWeatherWidget(c);
  applyTemperatureColor(Math.round(c.temperature_2m));
};

// ============================================================
// 7. "PRZYPOMNIJ MI" DLA WYDARZEŃ
// ============================================================

const REMINDERS_KEY = 'event_reminders';

function getReminders() {
  try { return JSON.parse(localStorage.getItem(REMINDERS_KEY) || '[]'); } catch { return []; }
}

function toggleEventReminder(eventId, eventName, eventDay, eventMonth) {
  const reminders = getReminders();
  const idx = reminders.findIndex(r => r.id === eventId);

  if (idx !== -1) {
    reminders.splice(idx, 1);
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
    if (typeof showToast === 'function') showToast('🔕 Przypomnienie usunięte');
    return false;
  }

  // Request notification permission
  if ('Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission().then(perm => {
      if (perm === 'granted') {
        addReminder(eventId, eventName, eventDay, eventMonth, reminders);
      } else {
        if (typeof showToast === 'function') showToast('⚠️ Zezwól na powiadomienia w ustawieniach przeglądarki');
      }
    });
  } else {
    addReminder(eventId, eventName, eventDay, eventMonth, reminders);
  }
  return true;
}

function addReminder(id, name, day, month, reminders) {
  const months = {CZE:6,LIP:7,SIE:8,MAJ:5,KWI:4,MAR:3,LUT:2,STY:1,WRZ:9,PAŹ:10,LIS:11,GRU:12};
  const m = months[month] || new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  const eventDate = new Date(year, m - 1, parseInt(day), 10, 0, 0);
  const reminderDate = new Date(eventDate.getTime() - 60 * 60 * 1000); // 1h before

  reminders.push({ id, name, day, month, reminderDate: reminderDate.toISOString() });
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));

  const msUntil = reminderDate - Date.now();
  if (msUntil > 0 && msUntil < 7 * 24 * 60 * 60 * 1000) {
    setTimeout(() => {
      if (Notification.permission === 'granted') {
        new Notification('🎉 Wydarzenie za godzinę!', {
          body: `${name} — ${day} ${month}`,
          tag: 'event-' + id
        });
      }
    }, msUntil);
  }

  if (typeof showToast === 'function') showToast(`🔔 Przypomnę Ci o "${name}" godzinę wcześniej`);
}

function isReminderSet(eventId) {
  return getReminders().some(r => r.id === eventId);
}

// Expose globally
window.toggleEventReminder = toggleEventReminder;
window.isReminderSet = isReminderSet;

// ============================================================
// 8. NOTATKI DO MIEJSC
// ============================================================

const NOTES_KEY = 'place_notes';

function getNote(placeId) {
  try {
    const notes = JSON.parse(localStorage.getItem(NOTES_KEY) || '{}');
    return notes[placeId] || '';
  } catch { return ''; }
}

function saveNote(placeId, text) {
  try {
    const notes = JSON.parse(localStorage.getItem(NOTES_KEY) || '{}');
    if (text.trim()) notes[placeId] = text.trim();
    else delete notes[placeId];
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  } catch {}
}

function renderNoteSection(placeId) {
  const note = getNote(placeId);
  return `
    <div class="place-note-section" id="note-section-${placeId}">
      <div class="pns-title">📝 Moja notatka <span class="pns-private">🔒 prywatna</span></div>
      <textarea class="pns-textarea" id="note-input-${placeId}"
        placeholder="Dodaj prywatną notatkę... (widoczna tylko dla Ciebie)"
        maxlength="300">${note}</textarea>
      <div class="pns-footer">
        <span class="pns-count" id="note-count-${placeId}">${note.length}/300</span>
        <button class="pns-save" onclick="handleSaveNote(${placeId})">💾 Zapisz</button>
        ${note ? `<button class="pns-delete" onclick="handleDeleteNote(${placeId})">🗑️</button>` : ''}
      </div>
    </div>
  `;
}

window.handleSaveNote = function(placeId) {
  const input = document.getElementById(`note-input-${placeId}`);
  if (!input) return;
  saveNote(placeId, input.value);
  if (typeof showToast === 'function') showToast('💾 Notatka zapisana');
  // Refresh note section
  const section = document.getElementById(`note-section-${placeId}`);
  if (section) section.outerHTML = renderNoteSection(placeId);
};

window.handleDeleteNote = function(placeId) {
  saveNote(placeId, '');
  if (typeof showToast === 'function') showToast('🗑️ Notatka usunięta');
  const section = document.getElementById(`note-section-${placeId}`);
  if (section) section.outerHTML = renderNoteSection(placeId);
};

// Live character counter
document.addEventListener('input', e => {
  if (e.target.id?.startsWith('note-input-')) {
    const id = e.target.id.replace('note-input-','');
    const counter = document.getElementById(`note-count-${id}`);
    if (counter) counter.textContent = `${e.target.value.length}/300`;
  }
});

// Expose
window.placeNotes = { getNote, saveNote, renderNoteSection };

// ============================================================
// INIT — wire everything up after app loads
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const waitForApp = setInterval(() => {
    if (window.state && !document.getElementById('app')?.classList.contains('hidden')) {
      clearInterval(waitForApp);
      setTimeout(() => {
        addSurpriseButton();
        buildTodayWidget();
      }, 800);
    }
  }, 300);
});
