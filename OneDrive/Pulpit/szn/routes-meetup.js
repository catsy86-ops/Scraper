/**
 * routes-meetup.js — System dołączania do tras i umawiania spotkań
 * Wszystko w localStorage — działa bez backendu
 * Funkcje:
 *  - Dołącz do trasy (z nickiem i avatarem)
 *  - Umów spotkanie (data, godzina, punkt startowy)
 *  - Lista uczestników z avatarami
 *  - Chat / komentarze do trasy
 *  - Powiadomienie o nadchodzącym spotkaniu
 */
'use strict';

const MEETUP_KEY   = 'route_meetups';    // { routeId: [meetup, ...] }
const JOINED_KEY   = 'route_joined';     // { routeId: [participant, ...] }
const COMMENTS_KEY = 'route_comments';   // { routeId: [comment, ...] }

// ===== DATA HELPERS =====
function getMeetups(routeId) {
  try {
    const all = JSON.parse(localStorage.getItem(MEETUP_KEY) || '{}');
    return (all[routeId] || []).filter(m => {
      // Remove past meetups (older than 24h)
      const dt = new Date(`${m.date}T${m.time}`);
      return dt > new Date(Date.now() - 24 * 60 * 60 * 1000);
    });
  } catch { return []; }
}

function saveMeetup(routeId, meetup) {
  try {
    const all = JSON.parse(localStorage.getItem(MEETUP_KEY) || '{}');
    if (!all[routeId]) all[routeId] = [];
    all[routeId].push(meetup);
    localStorage.setItem(MEETUP_KEY, JSON.stringify(all));
  } catch {}
}

function deleteMeetup(routeId, meetupId) {
  try {
    const all = JSON.parse(localStorage.getItem(MEETUP_KEY) || '{}');
    if (all[routeId]) {
      all[routeId] = all[routeId].filter(m => m.id !== meetupId);
      localStorage.setItem(MEETUP_KEY, JSON.stringify(all));
    }
  } catch {}
}

function getJoined(routeId) {
  try {
    const all = JSON.parse(localStorage.getItem(JOINED_KEY) || '{}');
    return all[routeId] || [];
  } catch { return []; }
}

function joinRoute(routeId, participant) {
  try {
    const all = JSON.parse(localStorage.getItem(JOINED_KEY) || '{}');
    if (!all[routeId]) all[routeId] = [];
    // Remove old entry for same user
    all[routeId] = all[routeId].filter(p => p.nick !== participant.nick);
    all[routeId].push({ ...participant, joinedAt: new Date().toISOString() });
    localStorage.setItem(JOINED_KEY, JSON.stringify(all));
  } catch {}
}

function leaveRoute(routeId, nick) {
  try {
    const all = JSON.parse(localStorage.getItem(JOINED_KEY) || '{}');
    if (all[routeId]) {
      all[routeId] = all[routeId].filter(p => p.nick !== nick);
      localStorage.setItem(JOINED_KEY, JSON.stringify(all));
    }
  } catch {}
}

function isJoinedRoute(routeId) {
  const profile = window.userProfile?.getProfile?.() || {};
  const nick = profile.name || localStorage.getItem('route_my_nick') || '';
  if (!nick) return false;
  return getJoined(routeId).some(p => p.nick === nick);
}

function getMyNick() {
  const profile = window.userProfile?.getProfile?.() || {};
  return profile.name || localStorage.getItem('route_my_nick') || '';
}

function getMyAvatar() {
  const profile = window.userProfile?.getProfile?.() || {};
  return profile.avatar || localStorage.getItem('route_my_avatar') || '🏃';
}

function getComments(routeId) {
  try {
    const all = JSON.parse(localStorage.getItem(COMMENTS_KEY) || '{}');
    return all[routeId] || [];
  } catch { return []; }
}

function addComment(routeId, text) {
  try {
    const all = JSON.parse(localStorage.getItem(COMMENTS_KEY) || '{}');
    if (!all[routeId]) all[routeId] = [];
    all[routeId].push({
      id: Date.now(),
      nick: getMyNick() || 'Anonim',
      avatar: getMyAvatar(),
      text,
      time: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })
    });
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(all));
  } catch {}
}

// ===== RENDER MEETUP SECTION =====
function renderMeetupSection(routeId, routeColor) {
  const meetups  = getMeetups(routeId);
  const joined   = getJoined(routeId);
  const comments = getComments(routeId);
  const amJoined = isJoinedRoute(routeId);
  const myNick   = getMyNick();

  const avatarColors = ['#6c63ff','#ff6584','#43e97b','#ffd93d','#4ecdc4','#fd79a8','#ff6b6b','#a29bfe'];
  const getAvatarColor = nick => avatarColors[nick.charCodeAt(0) % avatarColors.length];

  return `
    <div class="meetup-section" id="meetup-${routeId}">

      <!-- ===== UCZESTNICY ===== -->
      <div class="mu-block">
        <div class="mu-block-title">
          👥 Uczestnicy
          <span class="mu-count">${joined.length}</span>
        </div>

        ${joined.length ? `
          <div class="mu-participants">
            ${joined.map(p => `
              <div class="mu-participant" title="${p.nick}">
                <div class="mu-avatar" style="background:${getAvatarColor(p.nick)}">${p.avatar || p.nick.charAt(0).toUpperCase()}</div>
                <div class="mu-p-info">
                  <div class="mu-p-nick">${p.nick}</div>
                  <div class="mu-p-time">dołączył ${formatRelTime(p.joinedAt)}</div>
                </div>
                ${p.nick === myNick ? `<span class="mu-p-you">Ty</span>` : ''}
              </div>
            `).join('')}
          </div>
        ` : `<div class="mu-empty">Nikt jeszcze nie dołączył. Bądź pierwszy!</div>`}

        <!-- Join / Leave button -->
        ${amJoined ? `
          <button class="mu-btn mu-btn-leave" onclick="handleLeaveRoute(${routeId})">
            👋 Opuść trasę
          </button>
        ` : `
          <button class="mu-btn mu-btn-join" style="background:${routeColor}" onclick="handleJoinRoute(${routeId})">
            ✋ Dołącz do trasy
          </button>
        `}
      </div>

      <!-- ===== SPOTKANIA ===== -->
      <div class="mu-block">
        <div class="mu-block-title">
          📅 Spotkania
          <button class="mu-add-btn" onclick="showMeetupForm(${routeId})" title="Umów spotkanie">+ Umów</button>
        </div>

        <div id="meetup-form-${routeId}" class="mu-form hidden">
          <div class="mu-form-title">📅 Nowe spotkanie</div>
          <div class="mu-form-row">
            <label>Data:</label>
            <input type="date" id="mf-date-${routeId}" class="mu-input"
              min="${new Date().toISOString().split('T')[0]}"
              value="${new Date().toISOString().split('T')[0]}" />
          </div>
          <div class="mu-form-row">
            <label>Godzina:</label>
            <input type="time" id="mf-time-${routeId}" class="mu-input" value="10:00" />
          </div>
          <div class="mu-form-row">
            <label>Punkt startowy:</label>
            <input type="text" id="mf-place-${routeId}" class="mu-input"
              placeholder="np. Park Kadziaka, wejście główne" />
          </div>
          <div class="mu-form-row">
            <label>Notatka (opcjonalnie):</label>
            <input type="text" id="mf-note-${routeId}" class="mu-input"
              placeholder="np. Przynieś wodę, tempo spokojne" />
          </div>
          <div class="mu-form-actions">
            <button class="mu-btn mu-btn-primary" style="background:${routeColor}"
              onclick="submitMeetup(${routeId})">✅ Utwórz spotkanie</button>
            <button class="mu-btn mu-btn-cancel"
              onclick="hideMeetupForm(${routeId})">Anuluj</button>
          </div>
        </div>

        ${meetups.length ? `
          <div class="mu-meetups-list">
            ${meetups.map(m => renderMeetupCard(m, routeId, routeColor, myNick)).join('')}
          </div>
        ` : `<div class="mu-empty">Brak zaplanowanych spotkań. Umów pierwsze!</div>`}
      </div>

      <!-- ===== KOMENTARZE ===== -->
      <div class="mu-block">
        <div class="mu-block-title">💬 Komentarze <span class="mu-count">${comments.length}</span></div>

        <div class="mu-comments-list" id="comments-${routeId}">
          ${comments.length ? comments.slice(-10).reverse().map(c => `
            <div class="mu-comment">
              <div class="mu-comment-avatar" style="background:${getAvatarColor(c.nick)}">${c.avatar || c.nick.charAt(0)}</div>
              <div class="mu-comment-body">
                <div class="mu-comment-head">
                  <span class="mu-comment-nick">${c.nick}</span>
                  <span class="mu-comment-time">${c.date} ${c.time}</span>
                </div>
                <div class="mu-comment-text">${escapeHtml(c.text)}</div>
              </div>
            </div>
          `).join('') : '<div class="mu-empty">Bądź pierwszy — napisz komentarz!</div>'}
        </div>

        <div class="mu-comment-form">
          <input type="text" id="comment-input-${routeId}" class="mu-comment-input"
            placeholder="Napisz komentarz..." maxlength="200"
            onkeydown="if(event.key==='Enter')submitComment(${routeId})" />
          <button class="mu-comment-send" style="background:${routeColor}"
            onclick="submitComment(${routeId})">➤</button>
        </div>
      </div>

    </div>
  `;
}

function renderMeetupCard(m, routeId, routeColor, myNick) {
  const dt = new Date(`${m.date}T${m.time}`);
  const isToday = dt.toDateString() === new Date().toDateString();
  const isTomorrow = dt.toDateString() === new Date(Date.now() + 86400000).toDateString();
  const isPast = dt < new Date();
  const dayLabel = isPast ? '✅ Odbyło się' : isToday ? '🔴 Dziś' : isTomorrow ? '🟡 Jutro' : '📅 ' + dt.toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' });

  const attendees = m.attendees || [];
  const amAttending = attendees.includes(myNick);

  return `
    <div class="mu-meetup-card ${isPast ? 'past' : ''}">
      <div class="mu-meetup-header">
        <div class="mu-meetup-day-badge ${isToday ? 'today' : isPast ? 'past' : ''}">${dayLabel}</div>
        <div class="mu-meetup-time">⏰ ${m.time}</div>
        ${m.organizer === myNick ? `
          <button class="mu-meetup-delete" onclick="handleDeleteMeetup(${routeId},'${m.id}')" title="Usuń spotkanie">🗑️</button>
        ` : ''}
      </div>
      <div class="mu-meetup-place">📍 ${m.place || 'Punkt startowy trasy'}</div>
      ${m.note ? `<div class="mu-meetup-note">💬 ${m.note}</div>` : ''}
      <div class="mu-meetup-organizer">👤 Organizator: <strong>${m.organizer}</strong></div>

      <!-- Attendees -->
      <div class="mu-meetup-attendees">
        ${attendees.length ? `
          <div class="mu-attendees-avatars">
            ${attendees.slice(0, 6).map(a => `
              <div class="mu-att-avatar" title="${a}" style="background:${['#6c63ff','#ff6584','#43e97b','#ffd93d','#4ecdc4','#fd79a8'][a.charCodeAt(0)%6]}">${a.charAt(0).toUpperCase()}</div>
            `).join('')}
            ${attendees.length > 6 ? `<div class="mu-att-more">+${attendees.length - 6}</div>` : ''}
          </div>
          <span class="mu-att-count">${attendees.length} ${attendees.length === 1 ? 'osoba' : attendees.length < 5 ? 'osoby' : 'osób'}</span>
        ` : '<span class="mu-att-count">Brak uczestników</span>'}
      </div>

      ${!isPast ? `
        <button class="mu-btn ${amAttending ? 'mu-btn-leave' : 'mu-btn-join'}"
          style="${amAttending ? '' : 'background:' + routeColor}"
          onclick="handleToggleMeetupAttend(${routeId},'${m.id}')">
          ${amAttending ? '✓ Zapisany — Odwołaj' : '✋ Zapisz się'}
        </button>
      ` : ''}
    </div>
  `;
}

// ===== ACTIONS =====
window.handleJoinRoute = function(routeId) {
  let nick = getMyNick();
  if (!nick) {
    nick = prompt('Podaj swój nick (imię lub pseudonim):');
    if (!nick || !nick.trim()) return;
    nick = nick.trim();
    localStorage.setItem('route_my_nick', nick);
  }
  const avatar = getMyAvatar();
  joinRoute(routeId, { nick, avatar });
  if (typeof showToast === 'function') showToast(`✋ Dołączyłeś do trasy jako ${nick}!`);
  refreshMeetupSection(routeId);
  if (window.userProfile?.updateActivityStats) window.userProfile.updateActivityStats('route');
};

window.handleLeaveRoute = function(routeId) {
  const nick = getMyNick();
  if (!nick) return;
  if (!confirm(`Opuścić trasę jako ${nick}?`)) return;
  leaveRoute(routeId, nick);
  if (typeof showToast === 'function') showToast('👋 Opuściłeś trasę');
  refreshMeetupSection(routeId);
};

window.showMeetupForm = function(routeId) {
  const nick = getMyNick();
  if (!nick) {
    const n = prompt('Podaj swój nick aby umówić spotkanie:');
    if (!n || !n.trim()) return;
    localStorage.setItem('route_my_nick', n.trim());
  }
  document.getElementById(`meetup-form-${routeId}`)?.classList.remove('hidden');
};

window.hideMeetupForm = function(routeId) {
  document.getElementById(`meetup-form-${routeId}`)?.classList.add('hidden');
};

window.submitMeetup = function(routeId) {
  const date  = document.getElementById(`mf-date-${routeId}`)?.value;
  const time  = document.getElementById(`mf-time-${routeId}`)?.value;
  const place = document.getElementById(`mf-place-${routeId}`)?.value?.trim();
  const note  = document.getElementById(`mf-note-${routeId}`)?.value?.trim();

  if (!date || !time) { if (typeof showToast === 'function') showToast('⚠️ Wybierz datę i godzinę'); return; }

  const nick = getMyNick() || 'Anonim';
  const meetup = {
    id: Date.now().toString(),
    date, time,
    place: place || 'Punkt startowy trasy',
    note: note || '',
    organizer: nick,
    attendees: [nick],
    createdAt: new Date().toISOString()
  };

  saveMeetup(routeId, meetup);
  hideMeetupForm(routeId);
  if (typeof showToast === 'function') showToast('📅 Spotkanie zaplanowane!');
  refreshMeetupSection(routeId);
  scheduleNotification(meetup);
};

window.handleDeleteMeetup = function(routeId, meetupId) {
  if (!confirm('Usunąć to spotkanie?')) return;
  deleteMeetup(routeId, meetupId);
  if (typeof showToast === 'function') showToast('🗑️ Spotkanie usunięte');
  refreshMeetupSection(routeId);
};

window.handleToggleMeetupAttend = function(routeId, meetupId) {
  let nick = getMyNick();
  if (!nick) {
    nick = prompt('Podaj swój nick:');
    if (!nick || !nick.trim()) return;
    nick = nick.trim();
    localStorage.setItem('route_my_nick', nick);
  }

  try {
    const all = JSON.parse(localStorage.getItem(MEETUP_KEY) || '{}');
    const meetups = all[routeId] || [];
    const m = meetups.find(x => x.id === meetupId);
    if (!m) return;

    if (!m.attendees) m.attendees = [];
    if (m.attendees.includes(nick)) {
      m.attendees = m.attendees.filter(a => a !== nick);
      if (typeof showToast === 'function') showToast('✓ Odwołano udział');
    } else {
      m.attendees.push(nick);
      if (typeof showToast === 'function') showToast(`✋ Zapisano na spotkanie! (${m.attendees.length} osób)`);
      scheduleNotification(m);
    }
    localStorage.setItem(MEETUP_KEY, JSON.stringify(all));
    refreshMeetupSection(routeId);
  } catch {}
};

window.submitComment = function(routeId) {
  const input = document.getElementById(`comment-input-${routeId}`);
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  let nick = getMyNick();
  if (!nick) {
    nick = prompt('Podaj swój nick:');
    if (!nick || !nick.trim()) return;
    nick = nick.trim();
    localStorage.setItem('route_my_nick', nick);
  }

  addComment(routeId, text);
  input.value = '';
  refreshMeetupSection(routeId);
  if (typeof showToast === 'function') showToast('💬 Komentarz dodany');
};

// ===== REFRESH =====
function refreshMeetupSection(routeId) {
  const route = APP_DATA?.routes?.find(r => r.id === routeId);
  if (!route) return;
  const container = document.getElementById(`meetup-${routeId}`);
  if (!container) return;
  const newHtml = renderMeetupSection(routeId, route.color);
  container.outerHTML = newHtml;
}

// ===== NOTIFICATION =====
function scheduleNotification(meetup) {
  if (!('Notification' in window)) return;
  const dt = new Date(`${meetup.date}T${meetup.time}`);
  const msUntil = dt - Date.now() - 15 * 60 * 1000; // 15 min before
  if (msUntil <= 0 || msUntil > 24 * 60 * 60 * 1000) return;

  if (Notification.permission === 'granted') {
    setTimeout(() => {
      new Notification('🏃 Spotkanie za 15 minut!', {
        body: `📍 ${meetup.place} o ${meetup.time}`,
        tag: 'meetup-' + meetup.id
      });
    }, msUntil);
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(perm => {
      if (perm === 'granted') scheduleNotification(meetup);
    });
  }
}

// ===== HELPERS =====
function formatRelTime(isoStr) {
  if (!isoStr) return '';
  const diff = Date.now() - new Date(isoStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'przed chwilą';
  if (min < 60) return `${min} min temu`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h temu`;
  return `${Math.floor(h / 24)} dni temu`;
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ===== EXPORT =====
window.routesMeetup = {
  renderMeetupSection,
  getMeetups, getJoined, getComments,
  isJoinedRoute, getMyNick
};
