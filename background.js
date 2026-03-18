'use strict';

// Background service worker for unm.addon

// Install event
chrome.runtime.onInstalled.addListener(() => {
  // Set default settings on first install
  chrome.storage.sync.get('unmAddonSettings', (result) => {
    if (!result.unmAddonSettings) {
      const defaults = {
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
        accentColor:         '#00c853',
        compactMode:         false,
        hideFooter:          false,
        vetoMaps:            '',
        showKD:              true,
        showMMR:             true,
        showWinPct:          true,
      };
      chrome.storage.sync.set({ unmAddonSettings: defaults });
    }
  });
});

// Relay messages between popup and content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'settingsUpdate' || message.type === 'accountAction') {
    // Forward to all unmatched.gg tabs
    chrome.tabs.query({ url: ['https://unmatched.gg/*', 'https://*.unmatched.gg/*'] }, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, message, () => { void chrome.runtime.lastError; });
        }
      });
    });
  }
  // Keep the channel open for async response if needed
  return false;
});
