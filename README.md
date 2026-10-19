# Firefox Tab Group Unloader

A lightweight, native `userChrome.js` customization for Mozilla Firefox that adds an **"Unload all tabs"** button to the native Tab Group options menu.

Made entirely with AI. Use at your own risk.

```text
┌─────────────────────────────────────────────────────────────┐
│ Manage tab group                                            │
├─────────────────────────────────────────────────────────────┤
│ Name: [ Math-todo ]                                         │
│ 🔵 🟣 🟢 🟡 🔴 ⚪                                           │
├─────────────────────────────────────────────────────────────┤
│ New tab in group                                            │
│ Move group to new window                                    │
│ Copy links in group                                         │
│ Save and close group                                        │
│ Ungroup tabs                                                │
│ ─────────────────────────────────────────────────────────── │
│ Delete group                                                │
│ ─────────────────────────────────────────────────────────── │
│ Unload all tabs                  <-- Added by this script   │
└─────────────────────────────────────────────────────────────┘
```

---

## Features

* **One-Click Memory Reclamation:** Discards and hibernates all member tabs in the selected Tab Group instantly.
* **Full State Preservation:** Retains tab titles, icons, tab strip ordering, group association, containers, and history. Tabs are lazily reloaded on demand when clicked.
* **Smart Active Tab Focus Shift:** If you unload a group that contains the currently active tab, Firefox automatically shifts focus to an outside tab first, ensuring all tabs in the group can be unloaded.
* **Pixel-Perfect Native UI:** Injected directly into the native `<tabgroup-menu>` panel. Matches your Firefox theme, dark/light mode, and styling perfectly with zero titlebar leakage.
* **Zero Resource Overhead:** No background WebExtension processes, no continuous CPU polling, and no battery drain.

---

## Prerequisites

1. **Firefox 138+** (or modern Nightly / Developer Edition with native Tab Groups enabled: `browser.tabs.groups.enabled = true`).
2. An autoconfig script loader, such as [fx-autoconfig](https://github.com/MrOtherGuy/fx-autoconfig).

---

## Installation

### Automated Installation (Linux / Arch / Debian / Fedora)

Run the included installation helper:

```bash
git clone https://github.com/<your-username>/unload_extension.git
cd unload_extension
chmod +x src/install_loader.sh
./src/install_loader.sh
```

Then copy the script to your Firefox profile:

```bash
# Locate your profile directory in about:support -> Profile Folder
PROFILE_DIR=$(find ~/.mozilla/firefox -maxdepth 1 -name "*.default-release")
mkdir -p "$PROFILE_DIR/chrome/JS"
cp src/unload_tab_group.uc.js "$PROFILE_DIR/chrome/JS/"
```

Restart Firefox.

---

### Manual Installation (All Platforms)

1. **Set up fx-autoconfig:**
   - Follow instructions from [fx-autoconfig](https://github.com/MrOtherGuy/fx-autoconfig).
   - Place `config.js` into your Firefox installation directory (`/usr/lib/firefox` on Linux, `C:\Program Files\Mozilla Firefox` on Windows).
   - Place `config-prefs.js` into `defaults/pref/` in your Firefox installation directory.
   - Place the `utils/` folder into `<profile>/chrome/utils/`.

2. **Install the Script:**
   - Copy `src/unload_tab_group.uc.js` into your Firefox profile's `chrome/JS/` folder.

3. **Enable Stylesheet Customization:**
   - Open `about:config` in Firefox.
   - Set `toolkit.legacyUserProfileCustomizations.stylesheets` to `true`.

4. **Restart Firefox.**

---

## How It Works Under the Hood

Unlike sandboxed WebExtensions, `unload_tab_group.uc.js` runs directly within Firefox's privileged parent process (`chrome://browser/content/browser.xhtml`).

1. **Popup Detection:** It listens to the `popupshowing` event of `<tabgroup-menu id="tab-group-editor">`.
2. **Container Injection:** It injects a native `<toolbarbutton class="subviewbutton">` inside `.tab-group-edit-actions` right after `Delete group`.
3. **Tab Group Query:** It accesses `editor.activeGroup.tabs` to resolve all tabs in the group.
4. **Gecko Memory Engine:** It executes `window.gBrowser.discardBrowser(tab)` on every member tab, disposing of content processes and releasing RAM back to the operating system.

---

## Repository Structure

```text
unload_extension/
├── CommandCenter/       # PRD, Architecture Master, and Invariants Catalog
├── src/                 # Production userChrome.js script and loader helpers
├── dist/                # Verified deliverable symlink
├── tests/               # Validation battery records
├── reports/             # Technical feasibility studies and screenshot audits
├── README.md
└── LICENSE
```

---

## License

This project is licensed under the [Mozilla Public License 2.0](LICENSE).
