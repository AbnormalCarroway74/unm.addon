'use strict';

// ── Defaults ──────────────────────────────────────────────────────────────────
const DEFAULTS = {
  autoAccept:          true,
  profileModifiers:    true,
  websiteModifiers:    true,
  customRoleColors:    true,
  stealthStalking:     true,
  trueStatus:          true,
  acceptRevealer:      true,
  teamChatRevealer:    true,
  teammateRevealer:    true,
  simpleDiscord:       true,
  autoVeto:            false,
  userCards:           true,
  autoAdventRedeemer:  true,
  adBlocker:           true,
  autoAcceptDelay:          500,
  userCardDelay:            400,
  accentColor:              '#00c853',
  hideFooter:               false,
  compactMode:              false,
  vetoMaps:                 '',
  showKD:                   true,
  showMMR:                  true,
  showWinPct:               true,
  discordDesktopRedirect:   true,
  adminColor:               '#ff4444',
  modColor:                 '#ffaa00',
  vipColor:                 '#aa44ff',
  verifiedName:             '',
  profileRole:              'NONE',
  profileBorder:            'NONE',
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
const PUZZLE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20.5 11H19V7a2 2 0 0 0-2-2h-4V3.5a2.5 2.5 0 0 0-5 0V5H4a2 2 0 0 0-2 2v3.8h1.5a2.7 2.7 0 0 1 0 5.4H2V20a2 2 0 0 0 2 2h3.8v-1.5a2.7 2.7 0 0 1 5.4 0V22H17a2 2 0 0 0 2-2v-4h1.5a2.5 2.5 0 0 0 0-5z"/></svg>';

// ── Floating Action Button (bottom-right, godsense style) ─────────────────────
// Positioned to the LEFT of the unmatched.gg chat bubble icon
function injectFloatingButton() {
  if ($('#unm-addon-fab')) return;

  const fab = document.createElement('button');
  fab.id = 'unm-addon-fab';
  fab.className = 'unm-fab';
  fab.title = 'unm.addon';
  fab.innerHTML = PUZZLE_SVG;
  fab.setAttribute('aria-label', 'unm.addon menu');
  fab.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleOverlayMenu();
  });
  document.body.appendChild(fab);
}

// ── Overlay Menu ──────────────────────────────────────────────────────────────
let overlayVisible = false;

function buildOverlayMenu() {
  if ($('#unm-addon-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'unm-addon-overlay';
  overlay.className = 'unm-overlay';

  const accentColor = settings.accentColor || '#00c853';
  const vetoMaps = settings.vetoMaps || '';

  // Helper: builds a feature toggle row (with optional gear button)
  const featureRow = (key, label, isDanger, gearPage) => {
    const on = !!settings[key];
    const cls = on ? (isDanger ? 'unm-danger' : 'unm-success') : 'unm-off';
    const gear = gearPage
      ? '<button class="unm-gear' + (isDanger ? ' unm-gear-danger' : '') + '" data-page="' + gearPage + '">&#9881;</button>'
      : '';
    return '<div class="unm-row' + (gearPage ? ' unm-has-gear' : '') + '">'
      + '<button class="unm-btn ' + cls + ' unm-toggle" data-key="' + key + '">' + label + '</button>'
      + gear + '</div>';
  };

  overlay.innerHTML = '\
    <div class="unm-menu" id="unm-menu">\
\
      <!-- ── Root / home page (opens first) ── -->\
      <div class="unm-page active" id="unm-page-root">\
        <div class="unm-toolbar">\
          <span class="unm-title unm-title-brand">unm.addon</span>\
          <button class="unm-close-btn" id="unm-close-btn" title="Close">&#10005;</button>\
        </div>\
        <div class="unm-list">\
          <div class="unm-row"><button class="unm-btn unm-danger unm-nav" data-target="unm-page-account">Account Manager</button></div>\
          <div class="unm-row"><button class="unm-btn unm-danger unm-nav" data-target="unm-page-settings">Settings</button></div>\
        </div>\
        <div class="unm-version">unm.addon</div>\
      </div>\
\
      <!-- ── Settings page (all feature toggles) ── -->\
      <div class="unm-page" id="unm-page-settings">\
        <div class="unm-toolbar">\
          <button class="unm-back" data-target="unm-page-root">&#8592;</button>\
          <span class="unm-title">Settings</span>\
        </div>\
        <div class="unm-list">'
          + featureRow('autoAccept',         'Auto Accept',         false, 'unm-page-autoaccept')
          + featureRow('profileModifiers',   'Profile Modifiers',   false, 'unm-page-profile')
          + featureRow('websiteModifiers',   'Website Modifiers',   false, 'unm-page-website')
          + featureRow('customRoleColors',   'Custom Role Colors',  false, 'unm-page-rolecolors')
          + featureRow('stealthStalking',    'Stealth Stalking',    false, null)
          + featureRow('trueStatus',         'True Status',         false, null)
          + featureRow('acceptRevealer',     'Accept Revealer',     false, null)
          + featureRow('teamChatRevealer',   'Team Chat Revealer',  false, null)
          + featureRow('teammateRevealer',   'Teammate Revealer',   false, null)
          + featureRow('simpleDiscord',      'Simple Discord',      false, 'unm-page-discord')
          + featureRow('autoVeto',           'Auto Veto',           true,  'unm-page-veto')
          + featureRow('userCards',          'User Cards',          false, 'unm-page-usercards')
          + featureRow('autoAdventRedeemer', 'Auto Advent Redeemer',false, null)
          + featureRow('adBlocker',          'Ad Blocker',          false, null)
        + '</div>\
      </div>\
\
      <!-- ── Account Manager ── -->\
      <div class="unm-page" id="unm-page-account">\
        <div class="unm-toolbar">\
          <button class="unm-back" data-target="unm-page-root">&#8592;</button>\
          <span class="unm-title">Account Manager</span>\
        </div>\
        <div class="unm-list">\
          <div class="unm-row"><button class="unm-btn unm-danger unm-action" data-action="switchAccount">Switch Account</button></div>\
          <div class="unm-row"><button class="unm-btn unm-danger unm-action" data-action="switchSteamAccount">Switch Steam Account</button></div>\
          <div class="unm-row"><button class="unm-btn unm-danger unm-action" data-action="importAccount">Import Account</button></div>\
          <div class="unm-row"><button class="unm-btn unm-danger unm-action" data-action="exportAccount">Export Account</button></div>\
        </div>\
      </div>\
\
      <!-- ── Auto Accept settings ── -->\
      <div class="unm-page" id="unm-page-autoaccept">\
        <div class="unm-toolbar">\
          <button class="unm-back" data-target="unm-page-settings">&#8592;</button>\
          <span class="unm-title">Auto Accept</span>\
        </div>\
        <div class="unm-list unm-settings">\
          <label>Accept Delay (ms)</label>\
          <input type="number" class="unm-input" id="unm-autoAcceptDelay" min="0" max="5000" step="100" value="' + (settings.autoAcceptDelay || 500) + '" />\
        </div>\
      </div>\
\
      <!-- ── Profile Modifiers ── -->\
      <div class="unm-page" id="unm-page-profile">\
        <div class="unm-toolbar">\
          <button class="unm-back" data-target="unm-page-settings">&#8592;</button>\
          <span class="unm-title">Profile Modifiers</span>\
        </div>\
        <div class="unm-list unm-settings">\
          <label>Verified Name</label>\
          <input type="text" class="unm-input" id="unm-verifiedName" placeholder="" value="' + escapeHtml(settings.verifiedName || '') + '" />\
          <label>Role</label>\
          <select class="unm-input" id="unm-profileRole">\
            <option value="NONE"' + (settings.profileRole === 'NONE' ? ' selected' : '') + '>NONE</option>\
            <option value="Admin"' + (settings.profileRole === 'Admin' ? ' selected' : '') + '>Admin</option>\
            <option value="Moderator"' + (settings.profileRole === 'Moderator' ? ' selected' : '') + '>Moderator</option>\
            <option value="VIP"' + (settings.profileRole === 'VIP' ? ' selected' : '') + '>VIP</option>\
            <option value="Premium"' + (settings.profileRole === 'Premium' ? ' selected' : '') + '>Premium</option>\
            <option value="Contributor"' + (settings.profileRole === 'Contributor' ? ' selected' : '') + '>Contributor</option>\
          </select>\
          <label>Border</label>\
          <select class="unm-input" id="unm-profileBorder">\
            <option value="NONE"' + (settings.profileBorder === 'NONE' ? ' selected' : '') + '>NONE</option>\
            <option value="Gold"' + (settings.profileBorder === 'Gold' ? ' selected' : '') + '>Gold</option>\
            <option value="Diamond"' + (settings.profileBorder === 'Diamond' ? ' selected' : '') + '>Diamond</option>\
            <option value="Platinum"' + (settings.profileBorder === 'Platinum' ? ' selected' : '') + '>Platinum</option>\
            <option value="Silver"' + (settings.profileBorder === 'Silver' ? ' selected' : '') + '>Silver</option>\
          </select>\
          <button class="unm-btn unm-danger" id="unm-saveProfile">Save</button>\
        </div>\
      </div>\
\
      <!-- ── Website Modifiers ── -->\
      <div class="unm-page" id="unm-page-website">\
        <div class="unm-toolbar">\
          <button class="unm-back" data-target="unm-page-settings">&#8592;</button>\
          <span class="unm-title">Website Modifiers</span>\
        </div>\
        <div class="unm-list unm-settings">\
          <label>Accent Color <input type="color" class="unm-color" id="unm-accentColor" value="' + accentColor + '" /></label>\
          <label><input type="checkbox" id="unm-compactMode" ' + (settings.compactMode ? 'checked' : '') + ' /> Compact Mode</label>\
          <label><input type="checkbox" id="unm-hideFooter" ' + (settings.hideFooter ? 'checked' : '') + ' /> Hide Footer</label>\
        </div>\
      </div>\
\
      <!-- ── Custom Role Colors ── -->\
      <div class="unm-page" id="unm-page-rolecolors">\
        <div class="unm-toolbar">\
          <button class="unm-back" data-target="unm-page-settings">&#8592;</button>\
          <span class="unm-title">Custom Role Colors</span>\
        </div>\
        <div class="unm-list unm-settings">\
          <label>Admin <input type="color" class="unm-color" id="unm-adminColor" value="' + (settings.adminColor || '#ff4444') + '" /></label>\
          <label>Moderator <input type="color" class="unm-color" id="unm-modColor" value="' + (settings.modColor || '#ffaa00') + '" /></label>\
          <label>VIP <input type="color" class="unm-color" id="unm-vipColor" value="' + (settings.vipColor || '#aa44ff') + '" /></label>\
        </div>\
      </div>\
\
      <!-- ── Auto Veto ── -->\
      <div class="unm-page" id="unm-page-veto">\
        <div class="unm-toolbar">\
          <button class="unm-back" data-target="unm-page-settings">&#8592;</button>\
          <span class="unm-title">Auto Veto</span>\
        </div>\
        <div class="unm-list unm-settings">\
          <label>Maps to Veto (comma-separated)</label>\
          <input type="text" class="unm-input" id="unm-vetoMaps" placeholder="e.g. Dust2,Mirage" value="' + escapeHtml(vetoMaps) + '" />\
        </div>\
      </div>\
\
      <!-- ── User Cards ── -->\
      <div class="unm-page" id="unm-page-usercards">\
        <div class="unm-toolbar">\
          <button class="unm-back" data-target="unm-page-settings">&#8592;</button>\
          <span class="unm-title">User Cards</span>\
        </div>\
        <div class="unm-list unm-settings">\
          <label><input type="checkbox" id="unm-showKD" ' + (settings.showKD ? 'checked' : '') + ' /> Show K/D</label>\
          <label><input type="checkbox" id="unm-showMMR" ' + (settings.showMMR ? 'checked' : '') + ' /> Show MMR</label>\
          <label><input type="checkbox" id="unm-showWinPct" ' + (settings.showWinPct ? 'checked' : '') + ' /> Show Win %</label>\
          <label>Hover Delay (ms)</label>\
          <input type="number" class="unm-input" id="unm-userCardDelay" min="100" max="3000" step="100" value="' + (settings.userCardDelay || 400) + '" />\
        </div>\
      </div>\
\
      <!-- ── Simple Discord ── -->\
      <div class="unm-page" id="unm-page-discord">\
        <div class="unm-toolbar">\
          <button class="unm-back" data-target="unm-page-settings">&#8592;</button>\
          <span class="unm-title">Simple Discord</span>\
        </div>\
        <div class="unm-list unm-settings">\
          <label><input type="checkbox" id="unm-discordDesktopRedirect" ' + (settings.discordDesktopRedirect !== false ? 'checked' : '') + ' /> Use Desktop Redirect</label>\
          <button class="unm-btn unm-danger" id="unm-saveDiscord">Save</button>\
        </div>\
      </div>\
\
    </div>\
  ';

  document.body.appendChild(overlay);
  bindOverlayEvents();

  // Close when clicking outside the menu panel
  document.addEventListener('click', (e) => {
    if (!overlayVisible) return;
    const menu = $('#unm-menu');
    const fab  = $('#unm-addon-fab');
    if (menu && !menu.contains(e.target) && fab && !fab.contains(e.target)) {
      closeOverlayMenu();
    }
  }, { capture: true });
}

function bindOverlayEvents() {
  // Back buttons
  $$('.unm-back').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      if (target) overlayShowPage(target);
    });
  });

  // Close button
  const closeBtn = $('#unm-close-btn');
  if (closeBtn) closeBtn.addEventListener('click', closeOverlayMenu);

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

  // Number / text / checkbox inputs — persist on change
  $$('.unm-input, .unm-color, .unm-settings input[type="checkbox"]').forEach(el => {
    el.addEventListener('change', () => {
      const key = el.id.replace('unm-', '');
      // Map element IDs to settings keys
      const keyMap = {
        'accentColor':            'accentColor',
        'autoAcceptDelay':        'autoAcceptDelay',
        'userCardDelay':          'userCardDelay',
        'verifiedName':           'verifiedName',
        'profileRole':            'profileRole',
        'profileBorder':          'profileBorder',
        'vetoMaps':               'vetoMaps',
        'showKD':                 'showKD',
        'showMMR':                'showMMR',
        'showWinPct':             'showWinPct',
        'discordDesktopRedirect': 'discordDesktopRedirect',
        'adminColor':             'adminColor',
        'modColor':               'modColor',
        'vipColor':               'vipColor',
        'compactMode':            'compactMode',
        'hideFooter':             'hideFooter',
      };
      const settingsKey = keyMap[key];
      if (!settingsKey) return;
      if (el.type === 'checkbox') {
        settings[settingsKey] = el.checked;
      } else if (el.type === 'number') {
        settings[settingsKey] = parseInt(el.value, 10) || 0;
      } else {
        settings[settingsKey] = el.value;
      }
      saveOverlaySettings();
      applyFeatures();
    });
  });

  // Save buttons
  const saveProfile = $('#unm-saveProfile');
  if (saveProfile) {
    saveProfile.addEventListener('click', () => {
      saveOverlaySettings();
      applyProfileModifiers();
    });
  }

  const saveDiscord = $('#unm-saveDiscord');
  if (saveDiscord) {
    saveDiscord.addEventListener('click', () => {
      saveOverlaySettings();
    });
  }
}

function refreshToggleBtn(btn, key) {
  const enabled = !!settings[key];
  const isDanger = key === 'autoVeto';
  btn.className = 'unm-btn ' + (enabled ? (isDanger ? 'unm-danger' : 'unm-success') : 'unm-off') + ' unm-toggle';
}

function overlayShowPage(pageId) {
  $$('.unm-page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById(pageId);
  if (el) el.classList.add('active');
}

function toggleOverlayMenu() {
  overlayVisible ? closeOverlayMenu() : openOverlayMenu();
}

function openOverlayMenu() {
  buildOverlayMenu();
  const overlay = $('#unm-addon-overlay');
  const fab = $('#unm-addon-fab');
  if (overlay) {
    // Always re-open on root page
    overlayShowPage('unm-page-root');
    overlay.classList.add('visible');
    overlayVisible = true;
    if (fab) fab.classList.add('unm-fab-open');
  }
}

function closeOverlayMenu() {
  const overlay = $('#unm-addon-overlay');
  const fab = $('#unm-addon-fab');
  if (overlay) {
    overlay.classList.remove('visible');
    overlayVisible = false;
    if (fab) fab.classList.remove('unm-fab-open');
  }
}

// ── Notification Banner ───────────────────────────────────────────────────────
function showNotificationBanner(msg) {
  if ($('#unm-addon-banner')) return;
  const banner = document.createElement('div');
  banner.id = 'unm-addon-banner';
  banner.className = 'unm-banner';
  banner.innerHTML = '<span>' + PUZZLE_SVG + '</span><span class="unm-banner-text">unm.addon &middot; ' + msg + '</span><button class="unm-banner-close" title="Dismiss">&#10005;</button>';
  banner.querySelector('.unm-banner-close').addEventListener('click', () => banner.remove());
  document.body.insertAdjacentElement('afterbegin', banner);
  setTimeout(() => { if (banner.parentNode) banner.remove(); }, 8000);
}

// ── User Cards ────────────────────────────────────────────────────────────────
let userCardEl = null;
let userCardTimer = null;
let activeCardHref = null;

// Get the cleanest display name from an anchor element.
// Handles: avatar-only anchors (img[alt]), multi-line text (innerText first line),
// dedicated name child elements, title/aria-label attributes.
function getAnchorDisplayName(anchor) {
  // 1. Dedicated username child element (most precise)
  const nameEl = anchor.querySelector(
    '[class*="username"], [class*="nickname"], [class*="display-name"], ' +
    '[class*="player-name"], [class*="user-name"], [class*="visitor-name"]'
  );
  if (nameEl) {
    const t = (nameEl.innerText || nameEl.textContent || '').trim();
    if (t) return t;
  }

  // 2. First non-empty line of innerText (avoids multi-child concatenation)
  const lines = (anchor.innerText || '').trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length > 0) return lines[0];

  // 3. Image alt attribute (for avatar-only links)
  const img = anchor.querySelector('img[alt]');
  if (img && img.alt.trim()) return img.alt.trim();

  // 4. Title or aria-label on the anchor itself
  if (anchor.title && anchor.title.trim()) return anchor.title.trim();
  const al = anchor.getAttribute('aria-label');
  if (al && al.trim()) return al.trim();

  return '';
}

async function fetchPlayerStats(username) {
  // Try REST API endpoints first
  const apiEndpoints = [
    '/api/v1/users/' + encodeURIComponent(username),
    '/api/users/' + encodeURIComponent(username),
    '/api/v1/profile/' + encodeURIComponent(username),
    '/api/profile/' + encodeURIComponent(username),
  ];

  for (const ep of apiEndpoints) {
    try {
      const res = await fetch(ep, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data && (data.username || data.id || data.user || data.name)) return data;
      }
    } catch (_) { /* try next */ }
  }

  // Fallback: fetch the profile page and extract __NEXT_DATA__
  return fetchPlayerStatsFromPage(username);
}

async function fetchPlayerStatsFromPage(username) {
  try {
    const res = await fetch('/user/' + encodeURIComponent(username), { credentials: 'include' });
    if (!res.ok) return null;
    const html = await res.text();

    // Extract Next.js embedded data
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) return null;

    const nextData = JSON.parse(match[1]);
    const pp = nextData?.props?.pageProps;
    if (!pp) return null;

    // Try multiple paths for user data in Next.js pageProps,
    // covering direct props, nested data objects, and React Query / TanStack Query
    // dehydrated state (common in Next.js + React Query apps).
    const candidates = [
      pp.user,
      pp.userData,
      pp.profile,
      pp.data?.user,
      pp.data?.profile,
      pp.data,
      pp.initialData?.user,
      pp.initialData,
      pp.initialProps?.user,
      // React Query / TanStack Query dehydrated state
      pp.dehydratedState?.queries?.[0]?.state?.data?.user,
      pp.dehydratedState?.queries?.[0]?.state?.data?.profile,
      pp.dehydratedState?.queries?.[0]?.state?.data,
    ];
    for (const c of candidates) {
      if (c && typeof c === 'object' && !Array.isArray(c)) return c;
    }
    return null;
  } catch (_) { return null; }
}

// Extract an avatar image URL from the DOM near an anchor element.
// Looks inside the anchor first, then walks up to parent container rows.
// Returns the first usable `src` found, or '' if nothing is found.
// Minimum pixel dimension below which an image is considered an icon, not an avatar.
const _AVATAR_MIN_PX = 20;
// How many DOM ancestor levels to walk when searching for a nearby avatar image.
const _AVATAR_DOM_DEPTH = 4;

function getAnchorAvatarFromDOM(anchor) {
  // Helper: is this <img> likely an avatar (not a tiny icon/logo)?
  const isAvatarImg = (img) => {
    if (!img || !img.src) return false;
    // Skip data URIs (usually icons) and SVGs
    if (img.src.startsWith('data:image/svg') || img.src.endsWith('.svg')) return false;
    // Skip very small images (icons tend to be < _AVATAR_MIN_PX in DOM)
    const w = img.naturalWidth || img.width || img.offsetWidth || 0;
    const h = img.naturalHeight || img.height || img.offsetHeight || 0;
    if (w > 0 && w < _AVATAR_MIN_PX && h > 0 && h < _AVATAR_MIN_PX) return false;
    return true;
  };

  // 1. img directly inside the anchor
  const imgInAnchor = anchor.querySelector('img');
  if (imgInAnchor && isAvatarImg(imgInAnchor)) return imgInAnchor.src;

  // 2. Walk up the DOM tree looking for an avatar image in a sibling/parent container
  let node = anchor.parentElement;
  for (let i = 0; i < _AVATAR_DOM_DEPTH && node; i++, node = node.parentElement) {
    const imgs = node.querySelectorAll('img');
    for (const img of imgs) {
      if (img !== imgInAnchor && isAvatarImg(img)) return img.src;
    }
    // Stop at the document body
    if (node === document.body) break;
  }

  return '';
}

function buildUserCard(data, anchor) {
  const displayName = getAnchorDisplayName(anchor);

  // Unwrap user root — Next.js pageProps may nest under 'user'
  const u = data?.user || data;

  const name   = u?.username || u?.name || u?.displayName || u?.display_name ||
                 data?.username || data?.name || displayName;
  const userId = u?.id ?? data?.id ?? null;
  const status = u?.premium ? 'Premium'
               : (u?.tier || u?.status || data?.tier || data?.status || 'Free');

  // Avatar: try DOM first (most reliable — image is already rendered on page),
  // then fall back through many API field name variants (direct, Steam, etc.).
  const domAvatar = getAnchorAvatarFromDOM(anchor);
  const avatar = domAvatar
    || u?.avatar || u?.avatarUrl || u?.avatar_url
    || u?.profileImage || u?.profilePicture || u?.profilePhoto
    || u?.picture || u?.photo || u?.image || u?.imageUrl || u?.photoUrl
    || u?.thumbnailUrl || u?.thumbnail
    || u?.steamAvatar || u?.steam_avatar || u?.steamAvatarUrl || u?.steam_avatar_url
    || u?.avatarmedium || u?.avatarMedium || u?.avatarfull || u?.avatarFull
    || data?.avatar || data?.avatar_url || data?.avatarUrl
    || data?.profileImage || data?.profilePicture || data?.picture
    || data?.steamAvatar || data?.steam_avatar || data?.avatarmedium || data?.avatarfull
    || '';

  // Stats may come from a games array (Next.js scraped structure) or direct stats
  let kd = null, mmr = null, matches = null, winPct = null, game = 'CS:GO', mode = '2v2';

  const gamesArr = u?.games || u?.game_stats || data?.games || [];
  if (gamesArr.length > 0) {
    // Prefer the game with the most matches played
    const activeGame = gamesArr.slice().sort((a, b) =>
      ((b.matches || b.matches_played || 0) - (a.matches || a.matches_played || 0))
    )[0];
    if (activeGame) {
      kd      = activeGame.kd || activeGame.kdRatio || activeGame.kill_death_ratio || null;
      mmr     = activeGame.mmr || activeGame.elo || activeGame.rating || null;
      matches = activeGame.matches || activeGame.matches_played || activeGame.total_matches || null;
      winPct  = activeGame.winRate || activeGame.win_rate || activeGame.win_percentage || null;
      game    = activeGame.game || activeGame.name || activeGame.slug || 'CS:GO';
      mode    = activeGame.mode || activeGame.queue || activeGame.type || '2v2';
    }
  } else {
    // Direct stats fallback
    const s = u?.stats || data?.stats || {};
    kd      = s.kd      || u?.kd      || data?.kd      || null;
    mmr     = s.mmr     || s.elo      || u?.mmr     || data?.mmr     || null;
    matches = s.matches || s.total_matches || u?.matches || data?.matches || null;
    winPct  = s.winRate || s.win_rate || s.win_percentage || u?.winPct || data?.winPct || null;
    game    = s.game    || s.current_game || 'CS:GO';
    mode    = s.mode    || s.queue    || '2v2';
  }

  const card = document.createElement('div');
  card.className = 'unm-user-card';

  const avatarHtml = avatar
    ? '<img class="unm-card-avatar" src="' + escapeHtml(avatar) + '" alt="" />'
    : '<div class="unm-card-avatar-placeholder">?</div>';

  const tagHtml = userId !== null
    ? ' <span class="unm-card-tag">#' + escapeHtml(String(userId)) + '</span>'
    : '';

  // K/D and MMR shown in the header right column (matching unm.pwr layout)
  const kdNum = kd !== null ? parseFloat(kd) : null;
  const headerStatsHtml = (
    (settings.showKD && kdNum !== null && !isNaN(kdNum)
      ? '<div class="unm-card-hstat"><span class="unm-stat-label">K/D:</span>&nbsp;<span class="unm-stat-val">~' + kdNum.toFixed(2) + '</span></div>'
      : '') +
    (settings.showMMR && mmr !== null
      ? '<div class="unm-card-hstat"><span class="unm-stat-label">MMR:</span>&nbsp;<span class="unm-stat-val">~' + escapeHtml(String(mmr)) + '</span></div>'
      : '')
  );

  // Win % display: API may return decimal (0.55) or integer (55)
  const winPctNum = winPct !== null ? parseFloat(winPct) : null;
  const winPctDisplay = (winPctNum !== null && !isNaN(winPctNum))
    ? Math.round(winPctNum < 1 ? winPctNum * 100 : winPctNum) + '%'
    : null;

  const winPctHtml = (settings.showWinPct && winPctDisplay !== null)
    ? '<div class="unm-card-game-stat"><span class="unm-stat-label">Win %</span><strong>' + escapeHtml(winPctDisplay) + '</strong></div>'
    : '';

  const gameHtml = matches !== null ? (
    '<div class="unm-card-game-section">' +
    '<div class="unm-card-game-label">' + escapeHtml(String(game)) + '</div>' +
    '<div class="unm-card-game-row"><span class="unm-card-mode">' + escapeHtml(String(mode)) + '</span>' +
    '<div class="unm-card-game-stats">' +
    '<div class="unm-card-game-stat"><span class="unm-stat-label">Matches</span><strong>' + escapeHtml(String(matches)) + '</strong></div>' +
    winPctHtml +
    '</div></div></div>'
  ) : '';

  card.innerHTML =
    '<div class="unm-card-header">' + avatarHtml +
    '<div class="unm-card-info"><div class="unm-card-name">' + escapeHtml(name) + tagHtml + '</div>' +
    '<div class="unm-card-status">' + escapeHtml(status) + '</div></div>' +
    (headerStatsHtml ? '<div class="unm-card-header-stats">' + headerStatsHtml + '</div>' : '') +
    '</div>' + gameHtml;

  return card;
}

function positionCard(card, anchor) {
  const rect = anchor.getBoundingClientRect();
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  card.style.position = 'absolute';
  card.style.left = (rect.left + scrollX) + 'px';
  card.style.top  = (rect.bottom + scrollY + 6) + 'px';

  setTimeout(() => {
    const cr = card.getBoundingClientRect();
    if (cr.right > window.innerWidth - 8) {
      card.style.left = (window.innerWidth - cr.width - 8 + scrollX) + 'px';
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

  // displayName uses the anchor's visible text (not the URL segment)
  const displayName = getAnchorDisplayName(anchor) || username;

  const placeholder = document.createElement('div');
  placeholder.className = 'unm-user-card unm-card-loading';
  placeholder.textContent = 'Loading\u2026';
  document.body.appendChild(placeholder);
  positionCard(placeholder, anchor);
  userCardEl = placeholder;

  const data = await fetchPlayerStats(username);
  if (activeCardHref !== href) return;

  placeholder.remove();
  if (!data) {
    const domAvatar = getAnchorAvatarFromDOM(anchor);
    const fallback = document.createElement('div');
    fallback.className = 'unm-user-card';
    fallback.innerHTML =
      '<div class="unm-card-header">' +
      (domAvatar
        ? '<img class="unm-card-avatar" src="' + escapeHtml(domAvatar) + '" alt="" />'
        : '<div class="unm-card-avatar-placeholder">?</div>') +
      '<div class="unm-card-info"><div class="unm-card-name">' + escapeHtml(displayName) + '</div>' +
      '<div class="unm-card-status">Free</div></div></div>';
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
  // unmatched.gg uses /user/{id} (singular) as the primary profile URL pattern.
  const patterns = [
    /\/user\/([^/?#]+)/,
    /\/users\/([^/?#]+)/,
    /\/profile\/([^/?#]+)/,
    /\/players\/([^/?#]+)/,
    /\/u\/([^/?#]+)/,
  ];
  for (const p of patterns) {
    const m = href.match(p);
    if (m) {
      try { return decodeURIComponent(m[1]); } catch (_) { return m[1]; }
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
    setTimeout(() => { if (userCardEl && !userCardEl.matches(':hover')) removeUserCard(); }, 200);
  });

  document.addEventListener('mouseover', (e) => {
    if (userCardEl && userCardEl.contains(e.target)) clearTimeout(userCardTimer);
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
      setTimeout(() => { if (btn.offsetParent !== null) btn.click(); }, settings.autoAcceptDelay || 500);
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

// ── Teammate Revealer ─────────────────────────────────────────────────────────
function initTeammateRevealer() {
  const observer = new MutationObserver(debounce(runTeammateRevealer, 400));
  observer.observe(document.body, { childList: true, subtree: true, attributes: false, characterData: false });
  runTeammateRevealer();
}

function runTeammateRevealer() {
  if (!settings.teammateRevealer) {
    $$('.unm-party-label').forEach(el => el.remove());
    return;
  }

  const containerSelectors = [
    '[class*="lobby-player"]',
    '[class*="queue-player"]',
    '[class*="match-player"]',
    '[class*="team-member"]',
    '[class*="player-row"]',
    '[class*="party-member"]',
    '[class*="lobby-member"]',
  ];

  containerSelectors.forEach(sel => {
    $$(sel).forEach(playerEl => {
      if (playerEl.querySelector('.unm-party-label')) return;

      const isTeammate =
        playerEl.dataset.party !== undefined ||
        playerEl.dataset.squad !== undefined ||
        playerEl.dataset.queuedTogether === 'true' ||
        playerEl.classList.contains('party') ||
        playerEl.classList.contains('squad') ||
        playerEl.classList.contains('grouped') ||
        playerEl.querySelector('[class*="party-icon"]') !== null ||
        playerEl.querySelector('[class*="squad-icon"]') !== null;

      const label = document.createElement('span');
      label.className = isTeammate
        ? 'unm-party-label unm-party-teammate'
        : 'unm-party-label unm-party-random';
      label.textContent = isTeammate ? 'Teammate' : 'Random';
      playerEl.appendChild(label);
    });
  });
}

// ── Ad Blocker ────────────────────────────────────────────────────────────────
const AD_SELECTORS = [
  '[class*="advertisement"]', '[class*="ad-banner"]', '[class*="ad-container"]',
  '[class*="ad-wrapper"]', '[id*="google_ads"]', 'ins.adsbygoogle',
  '[class*="sidebar-ad"]', '[class*="leaderboard-ad"]',
  'iframe[src*="doubleclick"]', 'iframe[src*="googlesyndication"]',
];

function removeAds() {
  if (!settings.adBlocker) return;
  AD_SELECTORS.forEach(sel => { $$(sel).forEach(el => { el.style.display = 'none'; }); });
}

const adObserver = new MutationObserver(debounce(removeAds, 200));

function initAdBlocker() {
  removeAds();
  adObserver.observe(document.body, { childList: true, subtree: true });
}

// ── Stealth Stalking ──────────────────────────────────────────────────────────
// Prevents the site from logging your profile view by intercepting both
// fetch() and XMLHttpRequest requests that match profile-tracking URL patterns.
let _stealthOrigFetch    = null;
let _stealthOrigXHROpen  = null;
let _stealthOrigXHRSend  = null;
let _stealthActive       = false;

const _STEALTH_PATTERNS = [
  '/profile/view', '/profile-view', '/viewed', '/visit',
  'visitor', 'view_profile', 'profile_view', '/track', '/analytics',
];

function _stealthUrlBlocked(url) {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase();
  return _STEALTH_PATTERNS.some(p => lower.includes(p));
}

function initStealthStalking() {
  if (settings.stealthStalking && !_stealthActive) {
    _stealthOrigFetch    = window.fetch;
    _stealthOrigXHROpen  = XMLHttpRequest.prototype.open;
    _stealthOrigXHRSend  = XMLHttpRequest.prototype.send;
    _stealthActive = true;

    // Intercept fetch
    window.fetch = function(resource, init) {
      const url = typeof resource === 'string' ? resource
        : (resource instanceof Request ? resource.url : String(resource || ''));
      if (_stealthUrlBlocked(url)) {
        return Promise.resolve(new Response('{}', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }));
      }
      return _stealthOrigFetch.apply(this, arguments);
    };

    // Intercept XMLHttpRequest — mark blocked XHRs in open(), silently drop in send()
    const origOpen = _stealthOrigXHROpen;
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
      if (_stealthUrlBlocked(String(url || ''))) {
        this._unmStealthBlocked = true;
        return; // Leave XHR in UNSENT state — send() will be a no-op
      }
      return origOpen.call(this, method, url, ...rest);
    };

    const origSend = _stealthOrigXHRSend;
    XMLHttpRequest.prototype.send = function(...args) {
      if (this._unmStealthBlocked) return; // Silently discard the blocked request
      return origSend.apply(this, args);
    };

  } else if (!settings.stealthStalking && _stealthActive) {
    if (_stealthOrigFetch)   window.fetch = _stealthOrigFetch;
    if (_stealthOrigXHROpen) XMLHttpRequest.prototype.open = _stealthOrigXHROpen;
    if (_stealthOrigXHRSend) XMLHttpRequest.prototype.send = _stealthOrigXHRSend;
    _stealthOrigFetch   = null;
    _stealthOrigXHROpen = null;
    _stealthOrigXHRSend = null;
    _stealthActive = false;
  }
}

// ── Auto Advent Redeemer ──────────────────────────────────────────────────────
function initAutoAdventRedeemer() {
  const observer = new MutationObserver(debounce(() => {
    if (!settings.autoAdventRedeemer) return;
    ['button[class*="advent"]', 'button[class*="redeem"]', '.advent-calendar button'].forEach(sel => {
      $$(sel).forEach(btn => {
        if (!btn.dataset.unmRedeemed) {
          btn.dataset.unmRedeemed = '1';
          setTimeout(() => { if (btn.offsetParent !== null) btn.click(); }, 1000);
        }
      });
    });
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

// ── Website Modifier — apply accent color / compact / hide-footer ─────────────
function applyWebsiteModifiers() {
  let styleEl = document.getElementById('unm-website-modifiers-style');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'unm-website-modifiers-style';
    document.head.appendChild(styleEl);
  }
  const rules = [];
  if (settings.websiteModifiers) {
    if (settings.accentColor) {
      rules.push(':root { --unm-accent: ' + settings.accentColor + '; }');
    }
    if (settings.compactMode) {
      // CSS `:has(svg)` backup — hides text spans inside nav links that also contain an icon.
      // This covers cases where text is in a <span> sibling of <svg>.
      // Chrome extension target is Chrome ≥ 105 which supports :has().
      rules.push(
        'header a:has(svg) > span, header a:has(svg) > p, header button:has(svg) > span,' +
        '[class*="nav"] a:has(svg) > span, [class*="navbar"] a:has(svg) > span,' +
        '[class*="Header"] a:has(svg) > span, [class*="Navbar"] a:has(svg) > span' +
        ' { display: none !important; }'
      );
      // Keep the Play link text visible (unmatched.gg Play button is at /play)
      rules.push(
        'header a[href="/play"] > span, header a[href="/play"] > p,' +
        '[class*="nav"] a[href="/play"] > span, [class*="navbar"] a[href="/play"] > span,' +
        '[class*="Header"] a[href="/play"] > span, [class*="Navbar"] a[href="/play"] > span' +
        ' { display: revert !important; }'
      );
      // JS-based compact mode runs separately via applyCompactModeJS()
    }
    if (settings.hideFooter) {
      rules.push('footer, [class*="footer"] { display: none !important; }');
    }
  }
  styleEl.textContent = rules.join('\n');

  // Apply or remove JS-based compact mode
  if (settings.websiteModifiers && settings.compactMode) {
    applyCompactModeJS();
  } else {
    // Remove any previously applied compact-mode text hiding
    $$('.unm-compact-text').forEach(el => {
      el.classList.remove('unm-compact-text');
      delete el.dataset.unmCt;
    });
  }
}

// ── Compact Mode (JS) — hides text labels in site nav, keeps "Play" visible ───
function applyCompactModeJS() {
  // Candidate containers for the site's top navigation
  const containerSelectors = [
    'header', '[class*="Header"]', '[class*="Navbar"]', '[class*="navbar"]',
    '[class*="TopBar"]', '[class*="topBar"]', '[class*="NavBar"]',
  ];

  containerSelectors.forEach(sel => {
    $$(sel).forEach(container => {
      // Walk every anchor/button inside this container
      $$('a[href], button', container).forEach(link => {
        const href = (link.getAttribute('href') || '').toLowerCase();
        const linkText = (link.textContent || '').trim().toLowerCase();

        // ALWAYS keep the Play link untouched
        if (href === '/play' || href.endsWith('/play') || linkText === 'play') return;

        // Only process links that have an icon (SVG/img/i) — pure-text buttons are left alone
        if (!link.querySelector('svg, img, i[class]')) return;

        // Walk direct children and hide text-only elements
        Array.from(link.childNodes).forEach(node => {
          if (node.nodeType === Node.TEXT_NODE) {
            if (node.textContent.trim()) {
              // Wrap bare text nodes in a span so we can hide them
              if (!node._unmCtWrapped) {
                const s = document.createElement('span');
                s.className = 'unm-compact-text';
                s.dataset.unmCt = '1';
                node._unmCtWrapped = s;
                link.insertBefore(s, node);
                s.appendChild(node);
              }
            }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node;
            if (el.dataset.unmCt) return; // already processed
            // Hide element if it has no icon descendants and has visible text
            const hasIcon = el.querySelector('svg, img, i[class]') ||
                            el.tagName === 'svg' || el.tagName === 'SVG';
            if (!hasIcon && el.textContent.trim()) {
              el.classList.add('unm-compact-text');
              el.dataset.unmCt = '1';
            }
          }
        });
      });
    });
  });
}

// ── Profile Modifiers — inject verified name, role badge, border ──────────────
function applyProfileModifiers() {
  if (!settings.profileModifiers) return;

  // Verified Name: inject a checkmark badge next to the logged-in user's name
  if (settings.verifiedName) {
    $$('[class*="username"], [class*="display-name"], [class*="profile-name"]').forEach(el => {
      if (el.dataset.unmVerified) return;
      el.dataset.unmVerified = '1';
      const badge = document.createElement('span');
      badge.className = 'unm-verified-badge';
      badge.title = settings.verifiedName;
      badge.textContent = ' ✓';
      el.appendChild(badge);
    });
  }

  // Role badge: inject a colored role label under the user's avatar/name
  if (settings.profileRole && settings.profileRole !== 'NONE') {
    $$('[class*="profile-role"], [class*="user-role"]').forEach(el => {
      if (!el.dataset.unmRole) {
        el.dataset.unmRole = '1';
        el.textContent = settings.profileRole;
      }
    });
  }

  // Border: apply a CSS class to avatar elements on the current profile
  const BORDER_COLORS = { Gold: '#ffd700', Diamond: '#b9f2ff', Platinum: '#e5e4e2', Silver: '#c0c0c0' };
  let borderStyle = document.getElementById('unm-profile-border-style');
  if (!borderStyle) {
    borderStyle = document.createElement('style');
    borderStyle.id = 'unm-profile-border-style';
    document.head.appendChild(borderStyle);
  }
  const color = BORDER_COLORS[settings.profileBorder];
  borderStyle.textContent = color
    ? '[class*="avatar"] img, [class*="profile"] img.avatar { box-shadow: 0 0 0 3px ' + color + ' !important; border-radius: 8px; }'
    : '';
}

// ── True Status ───────────────────────────────────────────────────────────────
// Reveals the real online/in-game status of players by:
//  1. Un-hiding status-indicator elements hidden by the site (appear-offline users)
//  2. Intercepting API responses and surfacing the real `status` field in the DOM
function initTrueStatus() {
  // Watch for both child-list changes (new elements added) and
  // attribute changes (e.g. class swaps that toggle visibility).
  const observer = new MutationObserver(debounce(runTrueStatus, 400));
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
  runTrueStatus();
}

function runTrueStatus() {
  if (!settings.trueStatus) {
    const s = document.getElementById('unm-true-status-style');
    if (s) s.textContent = '';
    return;
  }

  // Un-hide any presence/status indicator elements the site has hidden.
  // Covers both inline-style hiding AND CSS-class-based hiding via a
  // persistent <style> override injected into <head>.
  const STATUS_SELECTORS = [
    '[class*="status-indicator"]',
    '[class*="online-status"]',
    '[class*="user-status"]',
    '[class*="presence"]',
    '[class*="player-status"]',
    '[class*="StatusDot"]',
    '[class*="OnlineBadge"]',
    '[class*="online-badge"]',
    '[class*="status-dot"]',
  ];

  // 1. CSS override — forces visibility regardless of class-based hiding.
  let styleEl = document.getElementById('unm-true-status-style');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'unm-true-status-style';
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = STATUS_SELECTORS.join(', ') +
    ' { display: revert !important; visibility: visible !important; opacity: 1 !important; }';

  // 2. Inline-style override — removes any explicit style="" hiding.
  STATUS_SELECTORS.forEach(sel => {
    $$(sel).forEach(el => {
      if (el.style.display === 'none')       el.style.removeProperty('display');
      if (el.style.visibility === 'hidden')  el.style.removeProperty('visibility');
      if (el.style.opacity === '0')          el.style.removeProperty('opacity');
    });
  });
}

// ── Simple Discord — intercept Discord links for desktop redirect ──────────────
let _discordListenerAdded = false;
function initSimpleDiscord() {
  if (_discordListenerAdded) return;
  _discordListenerAdded = true;
  document.addEventListener('click', (e) => {
    if (!settings.simpleDiscord || !settings.discordDesktopRedirect) return;
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.href || '';
    // Only redirect discord.gg invite links to the desktop app
    const m = href.match(/https?:\/\/(?:www\.)?discord\.gg\/([^/?#]+)/);
    if (m) {
      e.preventDefault();
      window.location.href = 'discord://invite/' + m[1];
    }
  }, true);
}

// ── Account Actions ───────────────────────────────────────────────────────────
function handleAccountAction(action) {
  switch (action) {
    case 'switchAccount':       window.location.href = '/login'; break;
    case 'switchSteamAccount':  window.location.href = '/auth/steam'; break;
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
  removeAds();
  applyWebsiteModifiers();
  applyProfileModifiers();
  runTrueStatus();
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
    initStealthStalking();
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
    // Inject FAB to the left of the chat bubble icon
    injectFloatingButton();

    // Re-inject if SPA navigation removes it
    const fabObserver = new MutationObserver(debounce(() => {
      if (!$('#unm-addon-fab')) injectFloatingButton();
    }, 600));
    fabObserver.observe(document.body, { childList: true, subtree: false });

    // Init features
    initUserCards();
    initAutoAccept();
    initAcceptRevealer();
    initTeamChatRevealer();
    initTeammateRevealer();
    initTrueStatus();
    initAdBlocker();
    initAutoAdventRedeemer();
    initAutoVeto();
    initStealthStalking();
    initSimpleDiscord();
    applyFeatures();

    // Re-apply compact mode whenever the SPA re-renders the header
    const compactObserver = new MutationObserver(debounce(() => {
      if (settings.websiteModifiers && settings.compactMode) applyCompactModeJS();
    }, 500));
    compactObserver.observe(document.body, { childList: true, subtree: true });

    if (!sessionStorage.getItem('unm-addon-booted')) {
      sessionStorage.setItem('unm-addon-booted', '1');
      showNotificationBanner('Active \u2014 click the puzzle-piece button (bottom-right, left of chat) to manage features.');
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
