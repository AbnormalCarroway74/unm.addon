'use strict';

// ── Defaults ──────────────────────────────────────────────────────────────────
const DEFAULTS = {
  powerWatermark:      false,
  autoAccept:          true,
  profileModifiers:    true,
  websiteModifiers:    true,
  customRoleColors:    true,
  stealthStalking:     true,
  trueStatus:          true,
  acceptRevealer:      true,
  teamChatRevealer:    true,
  simpleDiscord:       true,
  autoVeto:            false,
  userCards:           true,
  autoAdventRedeemer:  true,
  adBlocker:           true,
  autoAcceptDelay:     500,
  userCardDelay:       400,
  accentColor:         '#00c853',
  vetoMaps:            '',
  showKD:              true,
  showMMR:             true,
  showWinPct:          true,
};

let settings = { ...DEFAULTS };

// ── Utility ───────────────────────────────────────────────────────────────────
function $(sel, root = document) { return root.querySelector(sel); }
function $$(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// ── Storage ───────────────────────────────────────────────────────────────────
function loadSettings(cb) {
  chrome.storage.sync.get('unmAddonSettings', (res) => {
    if (res.unmAddonSettings) settings = { ...DEFAULTS, ...res.unmAddonSettings };
    if (cb) cb();
  });
}

// ── Puzzle Piece SVG ──────────────────────────────────────────────────────────
const PUZZLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
  <path d="M20.5 11H19V7a2 2 0 0 0-2-2h-4V3.5a2.5 2.5 0 0 0-5 0V5H4a2 2 0 0 0-2 2v3.8h1.5a2.7 2.7 0 0 1 0 5.4H2V20a2 2 0 0 0 2 2h3.8v-1.5a2.7 2.7 0 0 1 5.4 0V22H17a2 2 0 0 0 2-2v-4h1.5a2.5 2.5 0 0 0 0-5z"/>
</svg>`;

// ── Inject Tab-Bar Icon ───────────────────────────────────────────────────────
function injectTabBarIcon() {
  if ($('#unm-addon-tab-icon')) return;

  const btn = document.createElement('button');
  btn.id = 'unm-addon-tab-icon';
  btn.className = 'unm-addon-tab-btn';
  btn.title = 'unm.addon';
  btn.innerHTML = PUZZLE_SVG;
  btn.addEventListener('click', toggleOverlayMenu);

  // Try several selectors for the notification/bell area in unmatched.gg's nav
  const selectors = [
    '.header-notification',
    '[class*="notification-bell"]',
    '[class*="notifications-icon"]',
    '[class*="header-icons"]',
    '.navbar-icons',
    '[class*="nav-icons"]',
    '[class*="header-right"]',
    'header .right',
    'nav .right',
    '.header__right',
    '#header-right',
  ];

  let inserted = false;
  for (const sel of selectors) {
    const el = $(sel);
    if (el) {
      el.insertAdjacentElement('afterbegin', btn);
      inserted = true;
      break;
    }
  }

  if (!inserted) {
    // Fallback: try to find the notification bell icon link/button
    const notifCandidates = [
      $('a[href*="notification"]'),
      $('[class*="bell"]'),
      $('[aria-label*="notification" i]'),
      $('[title*="notification" i]'),
    ].filter(Boolean);

    if (notifCandidates.length > 0) {
      notifCandidates[0].insertAdjacentElement('beforebegin', btn);
      inserted = true;
    }
  }

  if (!inserted) {
    // Last resort: append to header/nav
    const header = $('header') || $('nav') || $('.header') || $('[class*="header"]');
    if (header) header.appendChild(btn);
  }
}

// ── Overlay Menu ──────────────────────────────────────────────────────────────
let overlayVisible = false;

function buildOverlayMenu() {
  if ($('#unm-addon-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'unm-addon-overlay';
  overlay.className = 'unm-overlay';

  overlay.innerHTML = `
    <div class="unm-menu" id="unm-menu">

      <!-- Features page -->
      <div class="unm-page active" id="unm-page-features">
        <div class="unm-toolbar">
          <button class="unm-back" data-target="unm-page-root">&#8592;</button>
          <span class="unm-title">unm.addon</span>
        </div>
        <div class="unm-list">
          <div class="unm-row"><button class="unm-btn ${settings.powerWatermark?'unm-danger':'unm-off'} unm-toggle" data-key="powerWatermark">Power Watermark</button></div>
          <div class="unm-row"><button class="unm-btn ${settings.autoAccept?'unm-success':'unm-off'} unm-toggle" data-key="autoAccept">Auto Accept</button></div>
          <div class="unm-row unm-has-gear"><button class="unm-btn ${settings.profileModifiers?'unm-success':'unm-off'} unm-toggle" data-key="profileModifiers">Profile Modifiers</button><button class="unm-gear" data-page="unm-page-profile">&#9881;</button></div>
          <div class="unm-row unm-has-gear"><button class="unm-btn ${settings.websiteModifiers?'unm-success':'unm-off'} unm-toggle" data-key="websiteModifiers">Website Modifiers</button><button class="unm-gear" data-page="unm-page-website">&#9881;</button></div>
          <div class="unm-row unm-has-gear"><button class="unm-btn ${settings.customRoleColors?'unm-success':'unm-off'} unm-toggle" data-key="customRoleColors">Custom Role Colors</button><button class="unm-gear" data-page="unm-page-rolecolors">&#9881;</button></div>
          <div class="unm-row"><button class="unm-btn ${settings.stealthStalking?'unm-success':'unm-off'} unm-toggle" data-key="stealthStalking">Stealth Stalking</button></div>
          <div class="unm-row"><button class="unm-btn ${settings.trueStatus?'unm-success':'unm-off'} unm-toggle" data-key="trueStatus">True Status</button></div>
          <div class="unm-row"><button class="unm-btn ${settings.acceptRevealer?'unm-success':'unm-off'} unm-toggle" data-key="acceptRevealer">Accept Revealer</button></div>
          <div class="unm-row"><button class="unm-btn ${settings.teamChatRevealer?'unm-success':'unm-off'} unm-toggle" data-key="teamChatRevealer">Team Chat Revealer</button></div>
          <div class="unm-row unm-has-gear"><button class="unm-btn ${settings.simpleDiscord?'unm-success':'unm-off'} unm-toggle" data-key="simpleDiscord">Simple Discord</button><button class="unm-gear" data-page="unm-page-discord">&#9881;</button></div>
          <div class="unm-row unm-has-gear"><button class="unm-btn ${settings.autoVeto?'unm-danger':'unm-off'} unm-toggle" data-key="autoVeto">Auto Veto</button><button class="unm-gear unm-gear-danger" data-page="unm-page-veto">&#9881;</button></div>
          <div class="unm-row unm-has-gear"><button class="unm-btn ${settings.userCards?'unm-success':'unm-off'} unm-toggle" data-key="userCards">User Cards</button><button class="unm-gear" data-page="unm-page-usercards">&#9881;</button></div>
          <div class="unm-row"><button class="unm-btn ${settings.autoAdventRedeemer?'unm-success':'unm-off'} unm-toggle" data-key="autoAdventRedeemer">Auto Advent Redeemer</button></div>
          <div class="unm-row"><button class="unm-btn ${settings.adBlocker?'unm-success':'unm-off'} unm-toggle" data-key="adBlocker">Ad Blocker</button></div>
        </div>
      </div>

      <!-- Root / meta page -->
      <div class="unm-page" id="unm-page-root">
        <div class="unm-toolbar">
          <button class="unm-back" data-target="unm-page-features">&#8592;</button>
          <span class="unm-title">unm.addon</span>
        </div>
        <div class="unm-list">
          <div class="unm-row"><button class="unm-btn unm-danger unm-nav" data-target="unm-page-account">Account Manager</button></div>
          <div class="unm-row"><button class="unm-btn unm-danger unm-nav" data-target="unm-page-features">Shared Features</button></div>
        </div>
      </div>

      <!-- Account Manager -->
      <div class="unm-page" id="unm-page-account">
        <div class="unm-toolbar">
          <button class="unm-back" data-target="unm-page-root">&#8592;</button>
          <span class="unm-title">Account Manager</span>
        </div>
        <div class="unm-list">
          <div class="unm-row"><button class="unm-btn unm-danger unm-action" data-action="switchAccount">Switch Account</button></div>
          <div class="unm-row"><button class="unm-btn unm-danger unm-action" data-action="switchSteamAccount">Switch Steam Account</button></div>
          <div class="unm-row"><button class="unm-btn unm-danger unm-action" data-action="importAccount">Import Account</button></div>
          <div class="unm-row"><button class="unm-btn unm-danger unm-action" data-action="exportAccount">Export Account</button></div>
        </div>
      </div>

      <!-- Profile Modifiers -->
      <div class="unm-page" id="unm-page-profile">
        <div class="unm-toolbar">
          <button class="unm-back" data-target="unm-page-features">&#8592;</button>
          <span class="unm-title">Profile Modifiers</span>
        </div>
        <div class="unm-list unm-settings">
          <label>Custom Status Text</label>
          <input type="text" class="unm-input" id="unm-customStatus" placeholder="e.g. Always Ready" maxlength="50" />
        </div>
      </div>

      <!-- Website Modifiers -->
      <div class="unm-page" id="unm-page-website">
        <div class="unm-toolbar">
          <button class="unm-back" data-target="unm-page-features">&#8592;</button>
          <span class="unm-title">Website Modifiers</span>
        </div>
        <div class="unm-list unm-settings">
          <label>Accent Color</label>
          <input type="color" class="unm-color" id="unm-accentColor" value="${settings.accentColor}" />
        </div>
      </div>

      <!-- Custom Role Colors -->
      <div class="unm-page" id="unm-page-rolecolors">
        <div class="unm-toolbar">
          <button class="unm-back" data-target="unm-page-features">&#8592;</button>
          <span class="unm-title">Custom Role Colors</span>
        </div>
        <div class="unm-list unm-settings">
          <label>Admin Color</label>
          <input type="color" class="unm-color" id="unm-adminColor" value="#ff4444" />
          <label>Moderator Color</label>
          <input type="color" class="unm-color" id="unm-modColor" value="#ffaa00" />
          <label>VIP Color</label>
          <input type="color" class="unm-color" id="unm-vipColor" value="#aa44ff" />
        </div>
      </div>

      <!-- Auto Veto -->
      <div class="unm-page" id="unm-page-veto">
        <div class="unm-toolbar">
          <button class="unm-back" data-target="unm-page-features">&#8592;</button>
          <span class="unm-title">Auto Veto</span>
        </div>
        <div class="unm-list unm-settings">
          <label>Maps to Veto (comma-separated)</label>
          <input type="text" class="unm-input" id="unm-vetoMaps" placeholder="e.g. Dust2,Mirage" value="${settings.vetoMaps || ''}" />
        </div>
      </div>

      <!-- User Cards -->
      <div class="unm-page" id="unm-page-usercards">
        <div class="unm-toolbar">
          <button class="unm-back" data-target="unm-page-features">&#8592;</button>
          <span class="unm-title">User Cards</span>
        </div>
        <div class="unm-list unm-settings">
          <label><input type="checkbox" id="unm-showKD" ${settings.showKD?'checked':''} /> Show K/D</label>
          <label><input type="checkbox" id="unm-showMMR" ${settings.showMMR?'checked':''} /> Show MMR</label>
          <label><input type="checkbox" id="unm-showWinPct" ${settings.showWinPct?'checked':''} /> Show Win %</label>
        </div>
      </div>

      <!-- Simple Discord -->
      <div class="unm-page" id="unm-page-discord">
        <div class="unm-toolbar">
          <button class="unm-back" data-target="unm-page-features">&#8592;</button>
          <span class="unm-title">Simple Discord</span>
        </div>
        <div class="unm-list unm-settings">
          <label>Discord Invite URL</label>
          <input type="url" class="unm-input" id="unm-discordInvite" placeholder="https://discord.gg/..." />
        </div>
      </div>

    </div><!-- /.unm-menu -->
  `;

  document.body.appendChild(overlay);

  // Close on backdrop click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeOverlayMenu();
  });

  bindOverlayEvents();
}

function bindOverlayEvents() {
  // Back buttons
  $$('.unm-back').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      if (target) overlayShowPage(target);
    });
  });

  // Navigation buttons
  $$('.unm-nav').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      if (target) overlayShowPage(target);
    });
  });

  // Gear buttons
  $$('.unm-gear').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.dataset.page;
      if (page) overlayShowPage(page);
    });
  });

  // Toggle buttons
  $$('.unm-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      if (!key) return;
      settings[key] = !settings[key];
      saveOverlaySettings();
      applyFeatures();
      refreshToggleBtn(btn, key);
    });
  });

  // Action buttons (account manager)
  $$('.unm-action').forEach(btn => {
    btn.addEventListener('click', () => {
      handleAccountAction(btn.dataset.action);
    });
  });
}

function refreshToggleBtn(btn, key) {
  const enabled = !!settings[key];
  const isDanger = key === 'powerWatermark' || key === 'autoVeto';
  btn.className = `unm-btn ${enabled ? (isDanger ? 'unm-danger' : 'unm-success') : 'unm-off'} unm-toggle`;
}

function overlayShowPage(pageId) {
  $$('.unm-page').forEach(p => p.classList.remove('active'));
  const el = $(`#${pageId}`);
  if (el) el.classList.add('active');
}

function toggleOverlayMenu() {
  overlayVisible ? closeOverlayMenu() : openOverlayMenu();
}

function openOverlayMenu() {
  buildOverlayMenu();
  const overlay = $('#unm-addon-overlay');
  if (overlay) {
    overlay.classList.add('visible');
    overlayVisible = true;
  }
}

function closeOverlayMenu() {
  const overlay = $('#unm-addon-overlay');
  if (overlay) {
    overlay.classList.remove('visible');
    overlayVisible = false;
  }
}

// ── Notification Banner ───────────────────────────────────────────────────────
function showNotificationBanner(msg) {
  if ($('#unm-addon-banner')) return;
  const banner = document.createElement('div');
  banner.id = 'unm-addon-banner';
  banner.className = 'unm-banner';
  banner.innerHTML = `<span>${PUZZLE_SVG}</span><span class="unm-banner-text">unm.addon &middot; ${msg}</span>
    <button class="unm-banner-close" title="Dismiss">&#10005;</button>`;
  banner.querySelector('.unm-banner-close').addEventListener('click', () => banner.remove());
  document.body.insertAdjacentElement('afterbegin', banner);
  setTimeout(() => { if (banner.parentNode) banner.remove(); }, 8000);
}

// ── User Cards ────────────────────────────────────────────────────────────────
let userCardEl = null;
let userCardTimer = null;
let activeCardHref = null;

async function fetchPlayerStats(username) {
  // Try the unmatched.gg API endpoints
  const endpoints = [
    `/api/v1/users/${encodeURIComponent(username)}`,
    `/api/users/${encodeURIComponent(username)}`,
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (_) { /* try next */ }
  }
  return null;
}

function buildUserCard(data, anchor) {
  // Parse what we can from the API response
  const name    = data?.username   || data?.name   || data?.user?.username || anchor.textContent.trim();
  const rank    = data?.rank       || data?.user?.rank    || '';
  const status  = data?.status     || data?.user?.status  || 'Free';
  const avatar  = data?.avatar     || data?.user?.avatar  || data?.profileImage || '';
  const kd      = data?.stats?.kd  || data?.kd     || null;
  const mmr     = data?.stats?.mmr || data?.mmr    || null;
  const matches = data?.stats?.matches || data?.matches || null;
  const winPct  = data?.stats?.winRate || data?.winPct  || null;
  const game    = data?.stats?.game    || 'CS:GO';
  const mode    = data?.stats?.mode    || '2v2';

  const card = document.createElement('div');
  card.className = 'unm-user-card';
  card.innerHTML = `
    <div class="unm-card-header">
      ${avatar ? `<img class="unm-card-avatar" src="${avatar}" alt="" />` : `<div class="unm-card-avatar-placeholder">?</div>`}
      <div class="unm-card-info">
        <div class="unm-card-name">${escapeHtml(name)}${rank ? ` <span class="unm-card-rank">#${rank}</span>` : ''}</div>
        <div class="unm-card-status">${escapeHtml(status)}</div>
      </div>
    </div>
    ${(kd !== null || mmr !== null) ? `
    <div class="unm-card-stats-row">
      ${(settings.showKD && kd !== null) ? `<div class="unm-card-stat"><span class="unm-stat-label">K/D</span><span class="unm-stat-val">~${parseFloat(kd).toFixed(2)}</span></div>` : ''}
      ${(settings.showMMR && mmr !== null) ? `<div class="unm-card-stat"><span class="unm-stat-label">MMR</span><span class="unm-stat-val">~${mmr}</span></div>` : ''}
    </div>` : ''}
    ${matches !== null ? `
    <div class="unm-card-game-section">
      <div class="unm-card-game-label">${escapeHtml(game)}</div>
      <div class="unm-card-game-row">
        <span class="unm-card-mode">${escapeHtml(mode)}</span>
        <div class="unm-card-game-stats">
          <span class="unm-stat-label">Matches</span> <strong>${matches}</strong>
          ${(settings.showWinPct && winPct !== null) ? `&nbsp;&nbsp;<span class="unm-stat-label">Win %</span> <strong>${winPct}%</strong>` : ''}
        </div>
      </div>
    </div>` : ''}
  `;
  return card;
}

function positionCard(card, anchor) {
  const rect = anchor.getBoundingClientRect();
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  card.style.position = 'absolute';
  card.style.left = `${rect.left + scrollX}px`;
  card.style.top  = `${rect.bottom + scrollY + 6}px`;

  // Ensure it doesn't overflow right edge
  setTimeout(() => {
    const cr = card.getBoundingClientRect();
    if (cr.right > window.innerWidth - 8) {
      card.style.left = `${window.innerWidth - cr.width - 8 + scrollX}px`;
    }
  }, 0);
}

async function showUserCardFor(anchor) {
  if (!settings.userCards) return;

  const href = anchor.href;
  if (activeCardHref === href && userCardEl) return;

  removeUserCard();
  activeCardHref = href;

  const username = extractUsername(href);
  if (!username) return;

  // Create a loading card placeholder
  const placeholder = document.createElement('div');
  placeholder.className = 'unm-user-card unm-card-loading';
  placeholder.textContent = 'Loading…';
  document.body.appendChild(placeholder);
  positionCard(placeholder, anchor);
  userCardEl = placeholder;

  const data = await fetchPlayerStats(username);
  if (activeCardHref !== href) return; // user moved away

  placeholder.remove();
  if (!data) {
    // Show minimal card with just the username from the link
    const fallback = document.createElement('div');
    fallback.className = 'unm-user-card';
    fallback.innerHTML = `<div class="unm-card-header"><div class="unm-card-avatar-placeholder">?</div>
      <div class="unm-card-info"><div class="unm-card-name">${escapeHtml(username)}</div><div class="unm-card-status">Free</div></div></div>`;
    document.body.appendChild(fallback);
    positionCard(fallback, anchor);
    userCardEl = fallback;
    return;
  }

  const card = buildUserCard(data, anchor);
  document.body.appendChild(card);
  positionCard(card, anchor);
  userCardEl = card;
}

function removeUserCard() {
  if (userCardEl) { userCardEl.remove(); userCardEl = null; }
  activeCardHref = null;
}

function extractUsername(href) {
  if (!href) return null;
  const patterns = [
    /\/user\/([^/?#]+)/,
    /\/profile\/([^/?#]+)/,
    /\/players\/([^/?#]+)/,
    /\/u\/([^/?#]+)/,
  ];
  for (const p of patterns) {
    const m = href.match(p);
    if (m) {
      try {
        return decodeURIComponent(m[1]);
      } catch (_) {
        return m[1]; // return raw value if decoding fails
      }
    }
  }
  return null;
}

function initUserCards() {
  document.addEventListener('mouseover', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || !extractUsername(a.href)) return;

    clearTimeout(userCardTimer);
    userCardTimer = setTimeout(() => showUserCardFor(a), settings.userCardDelay || 400);
  });

  document.addEventListener('mouseout', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || !extractUsername(a.href)) return;
    clearTimeout(userCardTimer);
    // Don't remove card immediately so user can move mouse onto it
    setTimeout(() => {
      if (userCardEl && !userCardEl.matches(':hover')) removeUserCard();
    }, 200);
  });

  document.addEventListener('mouseover', (e) => {
    if (userCardEl && userCardEl.contains(e.target)) {
      clearTimeout(userCardTimer);
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (!userCardEl) return;
    if (userCardEl.contains(e.target) && !userCardEl.contains(e.relatedTarget)) {
      setTimeout(() => { if (!userCardEl?.matches(':hover')) removeUserCard(); }, 200);
    }
  });
}

// ── Auto Accept ───────────────────────────────────────────────────────────────
const autoAcceptObserver = new MutationObserver(debounce(() => {
  if (!settings.autoAccept) return;

  const acceptSelectors = [
    'button[class*="accept"]',
    'button[class*="ready"]',
    'button[class*="confirm"]',
    '.ready-up button',
    '[data-testid="accept-match"]',
    '.match-found button:first-child',
  ];

  for (const sel of acceptSelectors) {
    const btn = $(sel);
    if (btn && !btn.dataset.unmAutoClicked) {
      btn.dataset.unmAutoClicked = '1';
      setTimeout(() => {
        if (btn.offsetParent !== null) btn.click();
      }, settings.autoAcceptDelay || 500);
      break;
    }
  }
}, 300));

function initAutoAccept() {
  autoAcceptObserver.observe(document.body, { childList: true, subtree: true });
}

// ── Accept Revealer ───────────────────────────────────────────────────────────
function initAcceptRevealer() {
  const observer = new MutationObserver(debounce(() => {
    if (!settings.acceptRevealer) return;

    // Reveal hidden accept status elements
    $$('[class*="accepted"]').forEach(el => {
      if (el.style.display === 'none' || el.style.visibility === 'hidden') {
        el.style.removeProperty('display');
        el.style.removeProperty('visibility');
        el.dataset.unmRevealed = '1';
      }
    });
  }, 300));

  observer.observe(document.body, { childList: true, subtree: true });
}

// ── Team Chat Revealer ────────────────────────────────────────────────────────
function initTeamChatRevealer() {
  const observer = new MutationObserver(debounce(() => {
    if (!settings.teamChatRevealer) return;

    $$('[class*="team-chat"] [class*="hidden"], [class*="team-message"][hidden]').forEach(el => {
      el.removeAttribute('hidden');
      el.style.removeProperty('display');
    });
  }, 300));

  observer.observe(document.body, { childList: true, subtree: true });
}

// ── Ad Blocker ────────────────────────────────────────────────────────────────
const AD_SELECTORS = [
  '[class*="advertisement"]',
  '[class*="ad-banner"]',
  '[class*="ad-container"]',
  '[class*="ad-wrapper"]',
  '[id*="google_ads"]',
  'ins.adsbygoogle',
  '[class*="sidebar-ad"]',
  '[class*="leaderboard-ad"]',
  'iframe[src*="doubleclick"]',
  'iframe[src*="googlesyndication"]',
];

function removeAds() {
  if (!settings.adBlocker) return;
  AD_SELECTORS.forEach(sel => {
    $$(sel).forEach(el => { el.style.display = 'none'; });
  });
}

const adObserver = new MutationObserver(debounce(removeAds, 200));

function initAdBlocker() {
  removeAds();
  adObserver.observe(document.body, { childList: true, subtree: true });
}

// ── Power Watermark ───────────────────────────────────────────────────────────
function applyPowerWatermark() {
  let wm = $('#unm-watermark');
  if (settings.powerWatermark) {
    if (!wm) {
      wm = document.createElement('div');
      wm.id = 'unm-watermark';
      wm.className = 'unm-watermark';
      wm.textContent = 'unm.addon';
      document.body.appendChild(wm);
    }
  } else {
    if (wm) wm.remove();
  }
}

// ── Auto Advent Redeemer ──────────────────────────────────────────────────────
function initAutoAdventRedeemer() {
  const observer = new MutationObserver(debounce(() => {
    if (!settings.autoAdventRedeemer) return;

    const redeemSelectors = [
      'button[class*="advent"]',
      'button[class*="redeem"]',
      '.advent-calendar button',
    ];

    for (const sel of redeemSelectors) {
      $$(sel).forEach(btn => {
        if (!btn.dataset.unmRedeemed) {
          btn.dataset.unmRedeemed = '1';
          setTimeout(() => { if (btn.offsetParent !== null) btn.click(); }, 1000);
        }
      });
    }
  }, 500));

  observer.observe(document.body, { childList: true, subtree: true });
}

// ── Auto Veto ─────────────────────────────────────────────────────────────────
function initAutoVeto() {
  const observer = new MutationObserver(debounce(() => {
    if (!settings.autoVeto) return;
    const mapsToVeto = (settings.vetoMaps || '').split(',').map(m => m.trim().toLowerCase()).filter(Boolean);
    if (!mapsToVeto.length) return;

    $$('[class*="veto-map"], [class*="map-veto"]').forEach(mapEl => {
      const mapName = mapEl.textContent.trim().toLowerCase();
      if (mapsToVeto.some(m => mapName.includes(m))) {
        const vetoBtn = mapEl.querySelector('button') || mapEl;
        if (!vetoBtn.dataset.unmVetoed) {
          vetoBtn.dataset.unmVetoed = '1';
          setTimeout(() => vetoBtn.click(), 300);
        }
      }
    });
  }, 400));

  observer.observe(document.body, { childList: true, subtree: true });
}

// ── Stealth Stalking ──────────────────────────────────────────────────────────
// Keep original fetch in a closure-scoped variable to avoid global exposure
let _stealthOrigFetch = null;
let _stealthActive = false;

function initStealthStalking() {
  // Intercept profile view XHR by monkey-patching fetch
  if (settings.stealthStalking && !_stealthActive) {
    _stealthOrigFetch = window.fetch;
    _stealthActive = true;
    window.fetch = function(resource, init) {
      const url = typeof resource === 'string' ? resource : (resource && resource.url) || '';
      // Suppress "profile viewed" ping
      if (url.includes('/profile/view') || url.includes('/viewed')) {
        return Promise.resolve(new Response('{}', { status: 200 }));
      }
      return _stealthOrigFetch.apply(this, arguments);
    };
  } else if (!settings.stealthStalking && _stealthActive) {
    if (_stealthOrigFetch) window.fetch = _stealthOrigFetch;
    _stealthOrigFetch = null;
    _stealthActive = false;
  }
}

// ── Account Actions ───────────────────────────────────────────────────────────
function handleAccountAction(action) {
  switch (action) {
    case 'switchAccount':
      window.location.href = '/login';
      break;
    case 'switchSteamAccount':
      window.location.href = '/auth/steam';
      break;
    case 'importAccount': {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const data = JSON.parse(ev.target.result);
            chrome.storage.sync.set({ unmAccount: data });
            showNotificationBanner('Account imported successfully.');
          } catch (_) {
            showNotificationBanner('Failed to import account: invalid file.');
          }
        };
        reader.readAsText(file);
      };
      input.click();
      break;
    }
    case 'exportAccount':
      chrome.storage.sync.get('unmAccount', (res) => {
        const data = JSON.stringify(res.unmAccount || {}, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'unm-addon-account.json';
        a.click();
        URL.revokeObjectURL(url);
      });
      break;
  }
  closeOverlayMenu();
}

// ── Apply All Features ────────────────────────────────────────────────────────
function applyFeatures() {
  applyPowerWatermark();
  removeAds();
}

// ── Save Settings ─────────────────────────────────────────────────────────────
function saveOverlaySettings() {
  chrome.storage.sync.set({ unmAddonSettings: settings });
}

// ── Message Listener ──────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'settingsUpdate') {
    settings = { ...DEFAULTS, ...msg.settings };
    applyFeatures();
  }
  if (msg.type === 'accountAction') {
    handleAccountAction(msg.action);
  }
});

// ── HTML Escape ───────────────────────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Boot ──────────────────────────────────────────────────────────────────────
function boot() {
  loadSettings(() => {
    // Inject tab bar puzzle piece icon
    injectTabBarIcon();

    // Observe DOM changes to re-inject if SPA navigates
    const headerObserver = new MutationObserver(debounce(() => {
      if (!$('#unm-addon-tab-icon')) injectTabBarIcon();
    }, 500));
    headerObserver.observe(document.body, { childList: true, subtree: true });

    // Init features
    initUserCards();
    initAutoAccept();
    initAcceptRevealer();
    initTeamChatRevealer();
    initAdBlocker();
    initAutoAdventRedeemer();
    initAutoVeto();
    initStealthStalking();
    applyFeatures();

    // Show a welcome notification once per session
    if (!sessionStorage.getItem('unm-addon-booted')) {
      sessionStorage.setItem('unm-addon-booted', '1');
      showNotificationBanner('unm.addon loaded — click the puzzle-piece icon in the header to manage features.');
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
