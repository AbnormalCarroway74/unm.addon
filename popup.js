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
  teammateRevealer:    true,
  simpleDiscord:       true,
  autoVeto:            false,
  userCards:           true,
  autoAdventRedeemer:  true,
  adBlocker:           true,
  autoAcceptDelay:     500,
  userCardDelay:       400,
  customStatusText:    '',
  accentColor:         '#00c853',
  compactMode:         false,
  adminColor:          '#ff4444',
  modColor:            '#ffaa00',
  vipColor:            '#aa44ff',
  discordInvite:       '',
  vetoMaps:            '',
  showKD:              true,
  showMMR:             true,
  showWinPct:          true,
};

// ── State ─────────────────────────────────────────────────────────────────────
let settings = { ...DEFAULTS };

// ── Page Navigation ───────────────────────────────────────────────────────────
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(pageId);
  if (target) target.classList.add('active');
}

// ── Toggle Buttons ────────────────────────────────────────────────────────────
function updateToggleButtons() {
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    const key = btn.dataset.key;
    if (key === undefined) return;
    const enabled = !!settings[key];
    btn.classList.toggle('off', !enabled);
    // Danger buttons (red): stay red when on, go gray when off
    // Success buttons (green): stay green when on, go gray when off
  });
}

function toggleFeature(key) {
  settings[key] = !settings[key];
  saveSettings();
  updateToggleButtons();
  notifyContentScript({ type: 'settingsUpdate', settings });
}

// ── Storage ───────────────────────────────────────────────────────────────────
function saveSettings() {
  chrome.storage.sync.set({ unmAddonSettings: settings });
}

function loadSettings(callback) {
  chrome.storage.sync.get('unmAddonSettings', (result) => {
    if (result.unmAddonSettings) {
      settings = { ...DEFAULTS, ...result.unmAddonSettings };
    }
    if (callback) callback();
  });
}

// ── Messaging ─────────────────────────────────────────────────────────────────
function notifyContentScript(message) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, message, () => {
        // Suppress "no listener" errors when content script isn't loaded yet
        void chrome.runtime.lastError;
      });
    }
  });
}

// ── Account Actions ───────────────────────────────────────────────────────────
function handleAccountAction(action) {
  notifyContentScript({ type: 'accountAction', action });
}

// ── Settings Page Sync ────────────────────────────────────────────────────────
function syncSettingsInputs() {
  const fields = [
    { id: 'autoAcceptDelay',  key: 'autoAcceptDelay',  type: 'number' },
    { id: 'userCardDelay',    key: 'userCardDelay',     type: 'number' },
    { id: 'customStatusText', key: 'customStatusText',  type: 'text'   },
    { id: 'accentColor',      key: 'accentColor',       type: 'color'  },
    { id: 'compactMode',      key: 'compactMode',       type: 'check'  },
    { id: 'adminColor',       key: 'adminColor',        type: 'color'  },
    { id: 'modColor',         key: 'modColor',          type: 'color'  },
    { id: 'vipColor',         key: 'vipColor',          type: 'color'  },
    { id: 'discordInvite',    key: 'discordInvite',     type: 'text'   },
    { id: 'vetoMaps',         key: 'vetoMaps',          type: 'text'   },
    { id: 'showKD',           key: 'showKD',            type: 'check'  },
    { id: 'showMMR',          key: 'showMMR',           type: 'check'  },
    { id: 'showWinPct',       key: 'showWinPct',        type: 'check'  },
  ];

  fields.forEach(({ id, key, type }) => {
    const el = document.getElementById(id);
    if (!el) return;

    // Set current value
    if (type === 'check') {
      el.checked = !!settings[key];
    } else {
      el.value = settings[key] ?? '';
    }

    // Listen for changes
    el.addEventListener('change', () => {
      if (type === 'check') {
        settings[key] = el.checked;
      } else if (type === 'number') {
        settings[key] = parseInt(el.value, 10) || 0;
      } else {
        settings[key] = el.value;
      }
      saveSettings();
      notifyContentScript({ type: 'settingsUpdate', settings });
    });
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadSettings(() => {
    updateToggleButtons();
    syncSettingsInputs();
  });

  // Back / Nav buttons
  document.querySelectorAll('.back-btn, .nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      if (target) showPage(target);
    });
  });

  // Toggle feature buttons
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      if (key) toggleFeature(key);
    });
  });

  // Gear buttons → open corresponding settings page
  document.querySelectorAll('.gear-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const pageId = 'page-' + btn.dataset.settings;
      const target = document.getElementById(pageId);
      if (target) showPage(pageId);
    });
  });

  // Account action buttons
  document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      handleAccountAction(btn.dataset.action);
    });
  });

  // Reset settings
  const resetBtn = document.getElementById('resetSettings');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      settings = { ...DEFAULTS };
      saveSettings();
      updateToggleButtons();
      syncSettingsInputs();
      notifyContentScript({ type: 'settingsUpdate', settings });
    });
  }

  // Save buttons in sub-pages
  const saveDiscord = document.getElementById('saveDiscord');
  if (saveDiscord) {
    saveDiscord.addEventListener('click', () => {
      const inv = document.getElementById('discordInvite');
      settings.discordInvite = inv ? inv.value : '';
      saveSettings();
    });
  }

  const saveVeto = document.getElementById('saveVeto');
  if (saveVeto) {
    saveVeto.addEventListener('click', () => {
      const maps = document.getElementById('vetoMaps');
      settings.vetoMaps = maps ? maps.value : '';
      saveSettings();
      notifyContentScript({ type: 'settingsUpdate', settings });
    });
  }
});
