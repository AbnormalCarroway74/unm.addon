# unm.addon

A browser extension that adds powerful features to [unmatched.gg](https://unmatched.gg). A combination of **unmatched.power** and **GodSense** features in one addon.

## Features

| Feature | Description |
|---|---|
| **Auto Accept** | Automatically clicks the match-found accept button |
| **User Cards** | Shows player K/D, MMR and win-rate on hover |
| **Ad Blocker** | Hides advertisement elements |
| **Accept Revealer** | Reveals who accepted / declined a match invite |
| **Team Chat Revealer** | Shows hidden team-chat messages |
| **Teammate Revealer** | Labels lobby players as **Teammate** or **Random** |
| **Stealth Stalking** | View profiles without triggering a "viewed" notification |
| **True Status** | Shows real online status |
| **Auto Veto** | Automatically vetos configured maps |
| **Auto Advent Redeemer** | Auto-redeems advent calendar rewards |
| **Profile Modifiers** | Customise profile status text |
| **Website Modifiers** | Change accent color, compact mode, hide footer |
| **Custom Role Colors** | Set custom colors for Admin / Mod / VIP roles |
| **Simple Discord** | Store and launch a Discord invite link |
| **Account Manager** | Switch, import and export accounts |

## Extension icon & in-page button

The toolbar icon is a **puzzle piece**. A circular red puzzle-piece floating action button also appears in the **bottom-right area of unmatched.gg, to the left of the chat bubble icon** — clicking it opens the full feature-menu overlay without leaving the page.

## Installation (developer mode)

1. Clone / download this repository.
2. Open **chrome://extensions** in Chrome.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select this folder.
5. Navigate to **unmatched.gg** — the red puzzle-piece button appears at the bottom-right of the page (left of the chat icon).

## In-page overlay navigation

```
FAB click → Root menu (unm.addon)
               ├─ Account Manager → Switch / Steam / Import / Export
               └─ Settings        → All feature toggles (each with optional ⚙ sub-page)
```

