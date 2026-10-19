# System Architecture & Technical Master Document

* **Project Name:** Firefox Tab Group Unloader
* **File:** `unload_tab_group.uc.js`
* **Architecture:** Gecko Browser Chrome Scripting (`userChrome.js`)

---

## 1. System Topology & Component Interactions

```text
┌─────────────────────────────────────────────────────────────┐
│                    Firefox Browser Window                   │
│          chrome://browser/content/browser.xhtml             │
├──────────────────────────────┬──────────────────────────────┤
│ Native Tab Strip Component   │ Popup Set Component          │
│                              │                              │
│ <tabbrowser-tabs>            │ <main-popupset>              │
│   ├── <tab-group>            │   └── <tabgroup-menu>        │
│   │     ├── [Math-todo] pill │         └── <panel>          │
│   │     ├── <tab> (member 1) │               ├── Swatches   │
│   │     └── <tab> (member 2) │               ├── Actions    │
│   └── <tab> (outside tab)    │               └── [Unload]   │
└──────────────────────────────┴──────────────────────────────┘
```

---

## 2. Component Directory Layout

```text
unload_extension/
├── CommandCenter/               # Specifications and architectural records
│   ├── PRD.md                   # Product requirements and scope
│   ├── MASTER.md                # System topology and interfaces
│   ├── invariants/catalog.md    # System invariants and behavioral guarantees
│   └── risk/fmea_risk_register.md # Risk analysis and mitigations
├── src/                         # Production source code
│   ├── unload_tab_group.uc.js   # Core userChrome.js script
│   ├── install_loader.sh        # System autoconfig installation utility
│   └── fx-autoconfig-program/   # Pre-staged autoconfig binary files
│       ├── config.js
│       └── defaults/pref/config-prefs.js
├── dist/                        # Deliverables
│   └── unload_tab_group.uc.js   # Relative symlink to src/unload_tab_group.uc.js
├── tests/                       # Test battery documentation
│   └── README.md
├── reports/                     # Forensic evaluations and screenshots
│   ├── FIREFOX_TAB_CONTEXT_MENU_FEASIBILITY.md
│   ├── FIREFOX_TAB_GROUP_PILL_FEASIBILITY.md
│   ├── USERCHROME_TAB_GROUP_UNLOAD_FEASIBILITY.md
│   └── screenshots/             # Visual audit captures
├── README.md                    # GitHub landing documentation
├── LICENSE                      # MPL-2.0 open source license
└── .gitignore                   # Repository hygiene rules
```

---

## 3. Data Flow & Interface Contracts

### 3.1 Hook Binding Interface
* **Target Element:** `document.getElementById("tab-group-editor")`
* **Event Target:** `editor.addEventListener("popupshowing", injectUnloadButton)`
* **Container Anchor:** `editor.querySelector(".tab-group-edit-actions")`
* **Button Element:** `<toolbarbutton id="tabGroupEditor_unloadAllTabs" class="subviewbutton tab-group-edit-mode-only" label="Unload all tabs">`

### 3.2 Tab Resolution & Discard Pipeline
1. **Target Group Identification:** Read `editor.activeGroup`.
2. **Member Tab Enumeration:** Read `editor.activeGroup.tabs`. Fallback to `Array.from(gBrowser.tabs).filter(t => t.group === editor.activeGroup)`.
3. **Active Viewport Protection & Shifting:**
   ```javascript
   if (memberTabs.includes(gBrowser.selectedTab)) {
     const outsideTab = Array.from(gBrowser.visibleTabs).find(t => !memberTabs.includes(t));
     if (outsideTab) {
       gBrowser.selectedTab = outsideTab;
     }
   }
   ```
4. **Disposal Engine:** `gBrowser.discardBrowser(tab)` for each non-selected tab.
5. **Popup Dismissal:** `editor.close()` or `editor.panel.hidePopup()`.
