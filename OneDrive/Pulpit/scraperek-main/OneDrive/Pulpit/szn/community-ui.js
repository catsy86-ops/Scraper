/**
 * Community UI — Enhanced
 * Full rebuild: hero, live feed, polls, groups, reviews, news, demographics
 */
'use strict';

const COMM_VOTED_KEY  = 'comm_survey_votes';
const COMM_JOINED_KEY = 'comm_joined_groups';
const COMM_LIKED_KEY  = 'comm_liked_reviews';

function getVoted()  { try { return JSON.parse(localStorage.getItem(COMM_VOTED_KEY)  || '{}'); } catch { return {}; } }
function getJoinedGroups() { try { return JSON.parse(localStorage.getItem(COMM_JOINED_KEY) || '[]'); } catch { return []; } }
function getLiked()  { try { return JSON.parse(localStorage.getItem(COMM_LIKED_KEY)  || '[]'); } catch { return []; } }

// ===== MAIN RENDER =====
function renderCommunity() {
  if (!window.communityAPI) { console.warn('Community API not loaded'); return; }

  const section = document.getElementById('section-community');
  if (!section) return;
  const content = section.querySelector('.section-content');
  if (!content) return;

  const stats = window.communityAPI.getStats();

  content.innerHTML = `
    <!-- Hero -->
    <div class="comm-hero">
      <div class="comm-hero-bg"></div>
      <div class="comm-hero-inner">
        <div class="comm-live-badge"><span class="live-dot"></span> NA ŻYWO</div>
        <h2 class="comm-hero-title">Społeczność Łuczniczej</h2>
        <p class="comm-hero-sub">Dane aktualizowane co 30 sekund</p>
        <div class="comm-hero-stats">
          <div class="chs-item">
            <span class="chs-num" id="chsPop">${stats.population.toLocaleString('pl')}</span>
            <span class="chs-label">👥 Mieszkańców</span>
          </div>
          <div class="chs-item">
            <span class="chs-num" id="chsActive">${stats.activeToday}</span>
            <span class="chs-label">🏃 Aktywnych dziś</span>
          </div>
          <div class="chs-item">
            <span class="chs-num">${stats.eventsThisMonth}</span>
            <span class="chs-label">🎉 Wydarzeń/mies.</span>
          </div>
          <div class="chs-item">
            <span class="chs-num">${stats.satisfaction}</span>
            <span class="chs-label">⭐ Ocena dzielnicy</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Nav pills -->
    <div class="comm-nav-pills" id="commNavPills">
      <button class="cnp-btn active" data-target="comm-activity">🔴 Na żywo</button>
      <button class="cnp-btn" data-target="comm-events">🎉 Eventy</button>
      <button class="cnp-btn" data-target="comm-groups">💬 Grupy</button>
      <button class="cnp-btn" data-target="comm-reviews">⭐ Opinie</button>
      <button class="cnp-btn" data-target="comm-surveys">🗳️ Ankiety</button>
      <button class="cnp-btn" data-target="comm-news">📰 Wiadomości</button>
      <button class="cnp-btn" data-target="comm-demo">📊 Statystyki</button>
    </div>

    <!-- Live activity -->
    <div id="comm-activity">
      <div class="comm-section-title">🔴 Aktywność Na Żywo <span class="comm-refresh-hint">auto-odświeżanie co 30s</span></div>
      <div id="liveActivityList" class="comm-activity-list"></div>
    </div>

    <!-- Events -->
    <div id="comm-events">
      <div class="comm-section-title">🎉 Nadchodzące Eventy</div>
      <div id="eventsCommunityList" class="comm-events-list"></div>
    </div>

    <!-- Groups -->
    <div id="comm-groups">
      <div class="comm-section-title">💬 Aktywne Grupy</div>
      <div id="groupsList" class="comm-groups-grid"></div>
    </div>

    <!-- Reviews -->
    <div id="comm-reviews">
      <div class="comm-section-title">⭐ Opinie Mieszkańców</div>
      <div id="reviewsCommunityList" class="comm-reviews-list"></div>
    </div>

    <!-- Surveys -->
    <div id="comm-surveys">
      <div class="comm-section-title">🗳️ Ankiety Społeczności</div>
      <div id="surveysList" class="comm-surveys-list"></div>
    </div>

    <!-- Recommendations -->
    <div id="comm-recs">
      <div class="comm-section-title">💡 Rekomendacje Mieszkańców</div>
      <div id="recommendationsList" class="comm-recs-grid"></div>
    </div>

    <!-- News -->
    <div id="comm-news">
      <div class="comm-section-title">📰 Wiadomości z Okolicy</div>
      <div id="newsList" class="comm-news-list"></div>
    </div>

    <!-- Demographics -->
    <div id="comm-demo">
      <div class="comm-section-title">📊 Statystyki Dzielnicy</div>
      <div id="demographicsChart"></div>
    </div>
  `;

  // Wire nav pills
  content.querySelectorAll('.cnp-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      content.querySelectorAll('.cnp-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.target);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Render all sub-sections
  renderLiveActivity();
  renderEventsCommunity();
  renderGroups();
  renderReviewsCommunity();
  renderSurveys();
  renderRecommendations();
  renderNews();
  renderDemographics();
}

// ===== STATS =====
function renderCommunityStats() {
  const stats = window.communityAPI.getStats();
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('chsPop',    stats.population.toLocaleString('pl'));
  set('chsActive', stats.activeToday);
  set('popStat',   stats.population.toLocaleString('pl'));
  set('houseStat', stats.households.toLocaleString('pl'));
  set('ageStat',   stats.avgAge + ' lat');
  set('densityStat', (stats.density / 1000).toFixed(1) + 'K');
}

// ===== LIVE ACTIVITY =====
function renderLiveActivity() {
  const container = document.getElementById('liveActivityList');
  if (!container) return;
  const activities = window.communityAPI.getLiveActivity();
  container.innerHTML = activities.map(act => `
    <div class="cal-item ${act.trending ? 'trending' : ''}">
      <div class="cal-icon">${act.icon}</div>
      <div class="cal-body">
        <div class="cal-title">
          ${act.title}
          ${act.trending ? '<span class="cal-trending">🔥 TRENDING</span>' : ''}
        </div>
        <div class="cal-desc">${act.desc}</div>
        <div class="cal-meta">
          <span>👥 ${act.participants} osób</span>
          <span>📍 ${act.location}</span>
          <span class="cal-time">${act.time}</span>
        </div>
      </div>
      <div class="cal-bar">
        <div class="cal-bar-fill" style="height:${Math.min(100, act.participants * 4)}%"></div>
      </div>
    </div>
  `).join('');
}

// ===== EVENTS =====
function renderEventsCommunity() {
  const container = document.getElementById('eventsCommunityList');
  if (!container) return;
  const events = window.communityAPI.getEvents();
  const catColors = { community:'#6c63ff', sport:'#ff6b6b', culture:'#ffd93d', family:'#43e97b', ecology:'#4ecdc4', default:'#a29bfe' };
  const catLabels = { community:'Społeczność', sport:'Sport', culture:'Kultura', family:'Rodzina', ecology:'Ekologia' };

  container.innerHTML = events.map(ev => {
    const color = catColors[ev.category] || catColors.default;
    const pct = ev.registered > 0 ? Math.round((ev.attendees / ev.registered) * 100) : 0;
    return `
      <div class="cev-card">
        <div class="cev-left" style="background:${color}22;border-left:4px solid ${color}">
          <div class="cev-icon">${ev.icon}</div>
          <div class="cev-date">${ev.date}</div>
          <div class="cev-time">${ev.time}</div>
        </div>
        <div class="cev-body">
          <div class="cev-cat" style="color:${color}">${catLabels[ev.category] || ev.category}</div>
          <div class="cev-title">${ev.title}</div>
          <div class="cev-desc">${ev.desc}</div>
          <div class="cev-meta">
            <span>📍 ${ev.location}</span>
            <span>🏢 ${ev.organizer}</span>
          </div>
          <div class="cev-footer">
            <div class="cev-reg">
              <span class="cev-reg-num">${ev.registered}</span> zapisanych
              ${ev.attendees > 0 ? `· ${ev.attendees} obecnych` : ''}
            </div>
            <div class="cev-progress-wrap">
              <div class="cev-progress" style="width:${Math.min(100, ev.registered / 2)}%;background:${color}"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ===== GROUPS =====
function renderGroups() {
  const container = document.getElementById('groupsList');
  if (!container) return;
  const groups = window.communityAPI.getGroups();
  const joined = getJoinedGroups();

  container.innerHTML = groups.map(g => {
    const isJoined = joined.includes(g.id);
    const actLabel = { very_active:'🔥 Bardzo aktywna', active:'✅ Aktywna', moderate:'○ Umiarkowana', inactive:'— Mało aktywna' }[g.activity] || '';
    return `
      <div class="cg-card">
        <div class="cg-header" style="background:${g.color}22">
          <span class="cg-icon">${g.icon}</span>
          <div class="cg-info">
            <div class="cg-name">${g.name}</div>
            <div class="cg-act">${actLabel}</div>
          </div>
          <button class="cg-join ${isJoined ? 'joined' : ''}" onclick="toggleJoinGroup('${g.id}', this)">
            ${isJoined ? '✓ Dołączono' : '+ Dołącz'}
          </button>
        </div>
        <p class="cg-desc">${g.desc}</p>
        <div class="cg-footer">
          <div class="cg-members-bar">
            <div class="cg-bar-fill" style="width:${g.activityPct}%;background:${g.color}"></div>
          </div>
          <div class="cg-meta">
            <span>👥 ${g.members} członków</span>
            <span>🕐 ${g.lastPost}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function toggleJoinGroup(id, btn) {
  let joined = getJoinedGroups();
  const isJoined = joined.includes(id);
  if (isJoined) {
    joined = joined.filter(j => j !== id);
    btn.textContent = '+ Dołącz';
    btn.classList.remove('joined');
    if (typeof showToast === 'function') showToast('👋 Opuszczono grupę');
  } else {
    joined.push(id);
    btn.textContent = '✓ Dołączono';
    btn.classList.add('joined');
    if (typeof showToast === 'function') showToast('✅ Dołączono do grupy!');
  }
  localStorage.setItem(COMM_JOINED_KEY, JSON.stringify(joined));
}

// ===== REVIEWS =====
function renderReviewsCommunity() {
  const container = document.getElementById('reviewsCommunityList');
  if (!container) return;
  const reviews = window.communityAPI.getReviews();
  const liked = getLiked();

  container.innerHTML = reviews.map(r => {
    const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
    const isLiked = liked.includes(r.id);
    return `
      <div class="cr-card">
        <div class="cr-head">
          <div class="cr-avatar">${r.avatar}</div>
          <div class="cr-meta">
            <div class="cr-author">${r.author}</div>
            <div class="cr-date">${r.date}</div>
          </div>
          <div class="cr-stars">${stars}</div>
        </div>
        <div class="cr-place">📍 ${r.place}</div>
        <div class="cr-text">"${r.text}"</div>
        <div class="cr-footer">
          <button class="cr-helpful ${isLiked ? 'liked' : ''}" onclick="toggleLikeReview('${r.id}', this)" data-count="${r.helpful}">
            👍 Pomocne (<span class="cr-count">${r.helpful}</span>)
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function toggleLikeReview(id, btn) {
  let liked = getLiked();
  const isLiked = liked.includes(id);
  const countEl = btn.querySelector('.cr-count');
  const current = parseInt(btn.dataset.count);
  if (isLiked) {
    liked = liked.filter(l => l !== id);
    btn.dataset.count = current - 1;
    if (countEl) countEl.textContent = current - 1;
    btn.classList.remove('liked');
  } else {
    liked.push(id);
    btn.dataset.count = current + 1;
    if (countEl) countEl.textContent = current + 1;
    btn.classList.add('liked');
    if (typeof showToast === 'function') showToast('👍 Oznaczono jako pomocne');
  }
  localStorage.setItem(COMM_LIKED_KEY, JSON.stringify(liked));
}

// ===== SURVEYS =====
function renderSurveys() {
  const container = document.getElementById('surveysList');
  if (!container) return;
  const surveys = window.communityAPI.getSurveys();
  const voted = getVoted();

  container.innerHTML = surveys.map(s => {
    const hasVoted = voted[s.id] != null;
    const maxVotes = Math.max(...s.options.map(o => o.votes));
    return `
      <div class="cs-card" id="survey-${s.id}">
        <div class="cs-question">${s.question}</div>
        <div class="cs-total">${s.total.toLocaleString('pl')} głosów</div>
        <div class="cs-options">
          ${s.options.map((opt, i) => {
            const pct = Math.round((opt.votes / s.total) * 100);
            const isWinner = opt.votes === maxVotes;
            const isMyVote = voted[s.id] === i;
            return `
              <div class="cs-opt ${hasVoted ? 'voted' : ''} ${isMyVote ? 'my-vote' : ''}"
                   onclick="${hasVoted ? '' : `castVote('${s.id}', ${i}, this)`}"
                   style="cursor:${hasVoted ? 'default' : 'pointer'}">
                <div class="cs-opt-label">
                  <span>${opt.text}</span>
                  ${isMyVote ? '<span class="cs-my-badge">✓ Twój głos</span>' : ''}
                  ${isWinner && hasVoted ? '<span class="cs-win-badge">🏆</span>' : ''}
                </div>
                <div class="cs-opt-bar-wrap">
                  <div class="cs-opt-bar" style="width:${hasVoted ? pct : 0}%;transition:width 0.8s ease"></div>
                </div>
                ${hasVoted ? `<span class="cs-opt-pct">${pct}%</span>` : ''}
              </div>
            `;
          }).join('')}
        </div>
        ${!hasVoted ? '<div class="cs-hint">Kliknij opcję aby zagłosować</div>' : ''}
      </div>
    `;
  }).join('');
}

function castVote(surveyId, optionIndex, el) {
  const voted = getVoted();
  if (voted[surveyId] != null) return;
  voted[surveyId] = optionIndex;
  localStorage.setItem(COMM_VOTED_KEY, JSON.stringify(voted));

  // Update data
  const survey = window.communityAPI.getSurveys().find(s => s.id === surveyId);
  if (survey) {
    survey.options[optionIndex].votes++;
    survey.total++;
  }
  renderSurveys();
  if (typeof showToast === 'function') showToast('🗳️ Głos oddany! Dziękujemy.');
}

// ===== RECOMMENDATIONS =====
function renderRecommendations() {
  const container = document.getElementById('recommendationsList');
  if (!container) return;
  const recs = window.communityAPI.getRecommendations();
  const typeConfig = {
    must_see: { label: '🎯 OBOWIĄZKOWE', color: '#ff6584' },
    tip:      { label: '💡 WSKAZÓWKA',   color: '#ffd93d' },
    event:    { label: '🎉 EVENT',        color: '#43e97b' }
  };

  container.innerHTML = recs.map(r => {
    const cfg = typeConfig[r.type] || { label: '📌 PORADA', color: '#a29bfe' };
    return `
      <div class="crec-card">
        <div class="crec-badge" style="background:${cfg.color}22;color:${cfg.color}">${cfg.label}</div>
        <div class="crec-title">${r.title}</div>
        <div class="crec-author">od ${r.author}</div>
        <p class="crec-desc">${r.desc}</p>
        <div class="crec-footer">
          <span class="crec-poi">📍 ${r.poi}</span>
          <span class="crec-votes">❤️ ${r.votes}</span>
        </div>
      </div>
    `;
  }).join('');
}

// ===== NEWS =====
function renderNews() {
  const container = document.getElementById('newsList');
  if (!container) return;
  const news = window.communityAPI.getNews();
  const catColors = { infrastructure:'#ff6b6b', improvement:'#43e97b', community:'#6c63ff', transport:'#ffd93d', default:'#a29bfe' };

  container.innerHTML = news.map(item => {
    const color = catColors[item.category] || catColors.default;
    return `
      <div class="cn-item">
        <div class="cn-icon-wrap" style="background:${color}22">
          <span class="cn-icon">${item.icon}</span>
        </div>
        <div class="cn-body">
          <div class="cn-title">${item.title}</div>
          <div class="cn-desc">${item.desc}</div>
          <div class="cn-meta">
            <span class="cn-date">📅 ${item.date}</span>
            <span class="cn-source" style="color:${color}">🏢 ${item.source}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ===== DEMOGRAPHICS =====
function renderDemographics() {
  const container = document.getElementById('demographicsChart');
  if (!container) return;
  const demo = window.communityAPI.getDemographics();
  const groups = demo.ageGroups;
  const total = Object.values(groups).reduce((s, g) => s + g.count, 0);

  container.innerHTML = `
    <!-- Donut chart (CSS-based) -->
    <div class="demo-donut-wrap">
      <div class="demo-donut">
        ${buildDonutSegments(groups)}
        <div class="demo-donut-center">
          <div class="demo-donut-num">${total.toLocaleString('pl')}</div>
          <div class="demo-donut-label">mieszkańców</div>
        </div>
      </div>
      <div class="demo-legend">
        ${Object.entries(groups).map(([range, g]) => `
          <div class="demo-leg-item">
            <span class="demo-leg-dot" style="background:${g.color}"></span>
            <span class="demo-leg-range">${range} lat</span>
            <span class="demo-leg-pct">${g.pct}%</span>
            <span class="demo-leg-count">(${g.count.toLocaleString('pl')})</span>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Bar chart -->
    <div class="demo-bars">
      ${Object.entries(groups).map(([range, g]) => `
        <div class="demo-bar-row">
          <div class="demo-bar-label">${range}</div>
          <div class="demo-bar-track">
            <div class="demo-bar-fill" style="width:${g.pct * 2.5}%;background:${g.color}" data-pct="${g.pct}"></div>
          </div>
          <div class="demo-bar-val">${g.pct}% · ${g.count.toLocaleString('pl')} os.</div>
        </div>
      `).join('')}
    </div>

    <!-- Employment stats -->
    <div class="comm-section-title" style="margin-top:24px">💼 Zatrudnienie</div>
    <div class="demo-employ-grid">
      ${Object.entries(demo.employment).map(([key, val]) => {
        const labels = { employed:'Pracujący', unemployed:'Bezrobotni', retired:'Emeryci', students:'Studenci', other:'Inne' };
        const icons  = { employed:'💼', unemployed:'📋', retired:'🏖️', students:'🎓', other:'👤' };
        return `
          <div class="demo-emp-item">
            <span class="demo-emp-icon">${icons[key]||'👤'}</span>
            <span class="demo-emp-num">${val.toLocaleString('pl')}</span>
            <span class="demo-emp-label">${labels[key]||key}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;

  // Animate bars
  setTimeout(() => {
    container.querySelectorAll('.demo-bar-fill').forEach(bar => {
      bar.style.transition = 'width 1s ease';
    });
  }, 100);
}

function buildDonutSegments(groups) {
  // Simple CSS conic-gradient donut
  const entries = Object.values(groups);
  let cumulative = 0;
  const stops = entries.map(g => {
    const start = cumulative;
    cumulative += g.pct;
    return `${g.color} ${start}% ${cumulative}%`;
  });
  return `<div class="demo-donut-ring" style="background:conic-gradient(${stops.join(',')})"></div>`;
}

// ===== AUTO-REFRESH =====
function setupCommunityRefresh() {
  setInterval(() => {
    if (document.getElementById('liveActivityList') &&
        !document.getElementById('section-community').classList.contains('hidden')) {
      renderLiveActivity();
      renderCommunityStats();
    }
  }, 30000);
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(setupCommunityRefresh, 200);
});

window.renderCommunity = renderCommunity;
