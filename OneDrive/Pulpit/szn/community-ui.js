/**
 * Community UI Rendering Module
 * Displays real-time community data
 */

'use strict';

function renderCommunity() {
  if (!window.communityAPI) {
    console.warn('Community API not loaded');
    return;
  }

  renderCommunityStats();
  renderLiveActivity();
  renderGroups();
  renderEventsCommunity();
  renderReviewsCommunity();
  renderRecommendations();
  renderNews();
  renderDemographics();

  console.log('✓ Community section rendered');
}

// ===== STATS =====
function renderCommunityStats() {
  const stats = window.communityAPI.getStats();

  document.getElementById('popStat').textContent = stats.population.toLocaleString();
  document.getElementById('houseStat').textContent = stats.households.toLocaleString();
  document.getElementById('ageStat').textContent = Math.round(stats.avgAge) + ' lat';
  document.getElementById('densityStat').textContent = (stats.density / 1000).toFixed(1) + 'K';
}

// ===== LIVE ACTIVITY =====
function renderLiveActivity() {
  const container = document.getElementById('liveActivityList');
  if (!container) return;

  const activities = window.communityAPI.getLiveActivity();
  
  container.innerHTML = activities.map(act => `
    <div class="activity-item ${act.trending ? 'trending' : ''}">
      <div class="activity-icon">${act.icon}</div>
      <div class="activity-content">
        <div class="activity-title">
          ${act.title}
          ${act.trending ? '<span class="trending-badge">🔥 TRENDING</span>' : ''}
        </div>
        <div class="activity-desc">${act.desc}</div>
        <div class="activity-meta">
          <div class="activity-participants">👥 ${act.participants} osób</div>
          <div class="activity-location">📍 ${act.location}</div>
          <div class="activity-time">${act.time}</div>
        </div>
      </div>
    </div>
  `).join('');
}

// ===== GROUPS =====
function renderGroups() {
  const container = document.getElementById('groupsList');
  if (!container) return;

  const groups = window.communityAPI.getGroups();

  container.innerHTML = groups.map(group => `
    <div class="group-card">
      <div class="group-header">
        <div class="group-icon">${group.icon}</div>
        <div>
          <h4 class="group-name">${group.name}</h4>
        </div>
      </div>
      <p class="group-desc">${group.description}</p>
      <div class="group-footer">
        <span class="group-members">${group.members} członków</span>
        <span class="group-activity">${getActivityLabel(group.activity)}</span>
      </div>
    </div>
  `).join('');
}

function getActivityLabel(activity) {
  const labels = {
    'very_active': '🔥 Bardzo aktywna',
    'active': '✓ Aktywna',
    'moderate': '○ Umiarkowana',
    'inactive': '- Mało aktywna'
  };
  return labels[activity] || 'Nieznana';
}

// ===== EVENTS =====
function renderEventsCommunity() {
  const container = document.getElementById('eventsCommunityList');
  if (!container) return;

  const events = window.communityAPI.getEvents();

  container.innerHTML = events.map(event => `
    <div class="event-card">
      <div class="event-icon">${event.icon}</div>
      <div class="event-content">
        <h4 class="event-title">${event.title}</h4>
        <p class="event-desc">${event.desc}</p>
        <div class="event-meta">
          <div class="event-date">📅 ${event.date} o ${event.time}</div>
          <div class="event-location">📍 ${event.location}</div>
          <div class="event-organizer">🏢 ${event.organizer}</div>
          <div class="event-attendees">
            ${event.registered} zapisanych
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// ===== REVIEWS =====
function renderReviewsCommunity() {
  const container = document.getElementById('reviewsCommunityList');
  if (!container) return;

  const reviews = window.communityAPI.getReviews();

  container.innerHTML = reviews.map(review => `
    <div class="review-card">
      <div class="review-header">
        <span class="review-author">${review.author}</span>
        <span class="review-rating">${'⭐'.repeat(review.rating)}</span>
      </div>
      <div class="review-place">📍 ${review.place}</div>
      <div class="review-text">"${review.text}"</div>
      <div class="review-footer">
        <span>${review.date}</span>
        <span class="review-helpful">
          👍 Przydatne (${review.helpful})
        </span>
      </div>
    </div>
  `).join('');
}

// ===== RECOMMENDATIONS =====
function renderRecommendations() {
  const container = document.getElementById('recommendationsList');
  if (!container) return;

  const recommendations = window.communityAPI.getRecommendations();

  container.innerHTML = recommendations.map(rec => `
    <div class="recommendation-card">
      <span class="rec-badge">${getRecBadge(rec.type)}</span>
      <h4 class="rec-title">${rec.title}</h4>
      <div class="rec-author">od ${rec.author}</div>
      <p class="rec-text">${rec.description}</p>
      <div class="rec-votes">❤️ ${rec.votes} polecen</div>
    </div>
  `).join('');
}

function getRecBadge(type) {
  const badges = {
    'must_see': '🎯 OBOWIĄZKOWE',
    'tip': '💡 WSKAZÓWKA',
    'event': '🎉 EVENT'
  };
  return badges[type] || 'PORADA';
}

// ===== NEWS =====
function renderNews() {
  const container = document.getElementById('newsList');
  if (!container) return;

  const news = window.communityAPI.getNews();

  container.innerHTML = news.map(item => `
    <div class="news-item">
      <h4 class="news-title">${item.title}</h4>
      <p class="news-desc">${item.desc}</p>
      <div class="news-meta">
        <span>${item.date}</span>
        <span>Źródło: ${item.source}</span>
      </div>
    </div>
  `).join('');
}

// ===== DEMOGRAPHICS =====
function renderDemographics() {
  const container = document.getElementById('demographicsChart');
  if (!container) return;

  const demo = window.communityAPI.getDemographics();
  const ageGroups = demo.ageGroups;
  const maxPct = 40; // for visual purposes

  container.innerHTML = `
    <div style="margin-bottom: 16px;">
      <h4 style="margin-bottom: 12px; color: var(--text);">Rozkład populacji po wieku</h4>
    </div>
    ${Object.entries(ageGroups).map(([range, data]) => `
      <div class="age-group">
        <div class="age-group-label">
          <span>${range} lat</span>
          <span style="color: var(--accent); font-weight: 600;">${data.pct}% (${data.count} osób)</span>
        </div>
        <div class="age-group-bar">
          <div class="age-group-fill" style="width: ${(data.pct / maxPct) * 100}%">
            ${data.pct}%
          </div>
        </div>
      </div>
    `).join('')}
  `;
}

// ===== AUTO-REFRESH =====
function setupCommunityRefresh() {
  // Refresh activity every 30 seconds
  setInterval(() => {
    const container = document.getElementById('liveActivityList');
    if (container && container.closest('.section') && !container.closest('.section').classList.contains('hidden')) {
      renderLiveActivity();
    }
  }, 30000);

  // Refresh stats every minute
  setInterval(() => {
    const container = document.getElementById('popStat');
    if (container && container.closest('.section') && !container.closest('.section').classList.contains('hidden')) {
      renderCommunityStats();
    }
  }, 60000);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    setupCommunityRefresh();
  }, 100);
});

// Export rendering function for app.js
window.renderCommunity = renderCommunity;
