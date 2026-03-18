# unm.addon

A browser extension that adds powerful features to [unmatched.gg](https://unmatched.gg).

## Features

| Feature | Description |
|---|---|
| **Auto Accept** | Automatically clicks the match-found accept button |
| **User Cards** | Shows player K/D, MMR and win-rate on hover |
| **Ad Blocker** | Hides advertisement elements |
| **Accept Revealer** | Reveals who accepted / declined a match invite |
| **Team Chat Revealer** | Shows hidden team-chat messages |
| **Stealth Stalking** | View profiles without triggering a "viewed" notification |
| **True Status** | Shows real online status |
| **Auto Veto** | Automatically vetos configured maps |
| **Auto Advent Redeemer** | Auto-redeems advent calendar rewards |
| **Power Watermark** | Displays an addon watermark badge |
| **Profile Modifiers** | Customise profile status text |
| **Website Modifiers** | Change accent color, enable compact mode |
| **Custom Role Colors** | Set custom colors for Admin / Mod / VIP roles |
| **Simple Discord** | Store and launch a Discord invite link |
| **Account Manager** | Switch, import and export accounts |

## Extension icon

The toolbar icon is a **puzzle piece** (replacing the previous crosshair). A circular red puzzle-piece floating action button is fixed in the **bottom-right corner** of the unmatched.gg page — clicking it opens the full feature-menu overlay without leaving the page.

## Installation (developer mode)

1. Clone / download this repository.
2. Open **chrome://extensions** in Chrome.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select this folder.
5. Navigate to **unmatched.gg** — the puzzle-piece icon will appear in the site header.

## Popup navigation

```
Features list  ←→  Root menu (← back arrow)
                       ├─ Account Manager → Switch / Steam / Import / Export
                       └─ Shared Features (returns to feature list)
```
