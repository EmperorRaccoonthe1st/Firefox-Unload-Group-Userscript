# Feasibility Study: Interacting with Firefox Tab Group Pills

* **Document Version:** 1.0.0
* **Status:** Complete [CONDITIONAL / MULTI-SCENARIO]
* **Target Feature:** Firefox Native Tab Group Pill (e.g., `Math-todo` capsule in tab strip)

---

## 1. Executive Summary

Interacting directly with or attaching custom buttons to the **Tab Group Pill** (the capsule label on the tab bar, such as `Math-todo` shown in the screenshot) presents a distinct set of technical constraints compared to right-clicking an individual tab.

Because the tab group pill is an internal component of Firefox's browser chrome UI (`browser.xhtml`) rather than a web page or standard tab element, feasibility depends entirely on the intended interaction model:

```text
┌─────────────────────────────────────────────────────────────────┐
│ FEASIBILITY BREAKDOWN BY INTERACTION SCENARIO                   │
│                                                                 │
│ 1. Intercepting Left-Click on Pill (WebExtension): [FAIL]       │
│    - Sandbox strictly blocks browser chrome DOM click listeners │
│                                                                 │
│ 2. Right-Click Context Menu on Pill (WebExtension): [FAIL]      │
│    - No `contexts: ["tab_group"]` in WebExtensions API         │
│                                                                 │
│ 3. Group Action via Tab Right-Click (WebExtension): [PASS]      │
│    - Right-click member tab -> inspect `tab.groupId` -> act    │
│                                                                 │
│ 4. Programmatic Group API Control (WebExtension): [PASS]        │
│    - Query, collapse, expand, move via `browser.tabGroups`     │
│                                                                 │
│ 5. Direct Pill Injection / Click Interception:     [PASS]       │
│    - Fully feasible via privileged `userChrome.js` / autoconfig │
└─────────────────────────────────────────────────────────────────┘
```

> **Important:** Standard WebExtensions operate inside a hardened sandbox. Extensions cannot attach `addEventListener("click")` to Firefox's native UI chrome, nor can they inject custom buttons directly into the tab bar next to the group pill. However, if your use case requires full chrome DOM control, Firefox supports privileged `userChrome.js` scripting.

---

## 2. Anatomy of the Tab Group Pill

Firefox's native tab group implementation structures the tab strip with custom Gecko elements:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        Native Firefox Tab Strip                        │
├─────────────────┬───────────────────┬───────────────────┬──────────────┤
│  Group Capsule  │     Member Tab    │     Member Tab    │   New Tab    │
│  [ Math-todo ]  │ [ Series & Div ]  │ [ Series & Div ]  │    [ + ]     │
│ (tab-group-item)│      (<tab>)      │      (<tab>)      │              │
└─────────────────┴───────────────────┴───────────────────┴──────────────┘
```

* **Left-Click Behavior:** Firefox natively binds left-click on the capsule to toggle collapse/expand state for all member tabs belonging to that `groupId`.
* **Right-Click Behavior:** Firefox opens a dedicated group configuration popup panel (`#tab-group-editor` or the tab group context menu) to edit group title, pick colors, ungroup, or close the group.

---

## 3. Evaluation of Technical Scenarios

### Scenario A: Intercepting Left-Click on the Pill (Standard WebExtension)
* **Verdict:** [FAIL] Unsupported
* **Technical Reason:** WebExtensions content scripts run strictly within web document contexts (`http://`, `https://`). The tab strip exists in the parent browser chrome window (`chrome://browser/content/browser.xhtml`). WebExtensions cannot attach event listeners to browser chrome elements. Left-click remains strictly bound to native group collapse/expand.

### Scenario B: Right-Click Custom Menu on the Pill (Standard WebExtension)
* **Verdict:** [FAIL] Currently Unsupported directly on the pill
* **Technical Reason:** The `browser.menus.create()` API supports `contexts: ["tab"]`, but the pill is an enclosing container (`<tab-group>` / `<tab-group-label>`), not a `<tab>` element.
* When a user right-clicks the pill, Firefox checks `event.target.closest("tab")`, which evaluates to `null`.
* WebExtensions does not currently implement a distinct `contexts: ["tab_group"]` context type.

### Scenario C: Group Actions via Member Tab Right-Click (Standard WebExtension)
* **Verdict:** [PASS] Fully Feasible
* **Architecture:** When a user right-clicks any tab that belongs to a group, `browser.menus.onClicked` receives the `tab` object with its populated `tab.groupId`.
* The extension can detect whether the clicked tab belongs to a group, query all other tabs sharing that `groupId`, and execute custom bulk operations.

### Scenario D: Programmatic Control via `tabGroups` API (Standard WebExtension)
* **Verdict:** [PASS] Fully Feasible
* **Architecture:** Firefox supports the `browser.tabGroups` and `browser.tabs.group()` / `browser.tabs.ungroup()` APIs.
* An extension cannot put a physical button on the pill itself, but it can trigger group collapse, rename, color change, or bulk operations from an extension toolbar popup, sidebar panel, or keyboard shortcut.

### Scenario E: Direct Pill Injection & Click Interception (`userChrome.js`)
* **Verdict:** [PASS] Fully Feasible (Browser Modding)
* **Architecture:** By enabling Firefox's built-in `autoconfig` script engine (commonly referred to as `userChrome.js` or fx-autoconfig), developers have unrestricted access to the browser chrome DOM.
* You can attach `click` or `contextmenu` listeners directly to the `.tab-group-label` element, prevent default collapse behavior, or inject custom buttons directly inside the pill.

---

## 4. Workarounds and Recommended Implementation Patterns

### Pattern 1: WebExtension "Tab Group Context Action" (Standard Approach)

If you must distribute the extension via Mozilla Add-ons (AMO), use the member tab context menu with group awareness.

#### `manifest.json` (Manifest V3)
```json
{
  "manifest_version": 3,
  "name": "Tab Group Action Helper",
  "version": "1.0.0",
  "permissions": [
    "menus",
    "tabs",
    "tabGroups"
  ],
  "background": {
    "scripts": ["background.js"]
  }
}
```

#### `background.js`
```javascript
// Register item on tab context menu
browser.runtime.onInstalled.addListener(() => {
  browser.menus.create({
    id: "group-custom-action",
    title: "Execute Action on Entire Tab Group",
    contexts: ["tab"]
  });
});

browser.menus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "group-custom-action") {
    return;
  }

  // 1. Verify if the tab is in a group
  if (!tab.groupId || tab.groupId === -1) {
    console.log("Tab does not belong to a group.");
    return;
  }

  // 2. Fetch group metadata
  const group = await browser.tabGroups.get(tab.groupId);
  console.log(`Targeting group: ${group.title} (ID: ${group.id})`);

  // 3. Query all tabs in this specific group
  const groupTabs = await browser.tabs.query({
    currentWindow: true,
    groupId: tab.groupId
  });

  console.log(`Found ${groupTabs.length} tabs in group.`);

  // 4. Perform batch action (e.g. reload, bookmark, or collapse)
  for (const memberTab of groupTabs) {
    console.log(`Processing member: ${memberTab.title} (${memberTab.url})`);
  }

  // Example: Toggle group collapsed state
  await browser.tabGroups.update(group.id, {
    collapsed: !group.collapsed
  });
});
```

---

### Pattern 2: Privileged `userChrome.js` Direct Pill Click Interception

If the project is for personal use, internal tooling, or a specialized browser setup (e.g., Zen Browser, Floorp, or custom Firefox profile), you can intercept clicks on the group pill directly.

#### `tab_group_pill_click.uc.js`
```javascript
// ==UserScript==
// @name         Custom Tab Group Pill Click Action
// @description  Intercepts clicks on native tab group pills
// @author       Developer
// @include      main
// ==/UserScript==

(function() {
  function initTabGroupPillListener() {
    const tabStrip = document.getElementById("tabbrowser-tabs");
    if (!tabStrip) return;

    // Listen to click events on the tab strip
    tabStrip.addEventListener("click", function(event) {
      // Find closest tab-group pill label
      const groupLabel = event.target.closest(".tab-group-label, tab-group");
      if (!groupLabel) return;

      // Check for modifier keys or specific click targets
      if (event.ctrlKey || event.button === 1) { // Middle click or Ctrl+Click
        event.preventDefault();
        event.stopPropagation();

        console.log("Custom pill action triggered on group pill!");
        // Custom logic: e.g. Close entire group, save session, open custom modal
      }
    }, true); // Use capture phase to intercept before native collapse
  }

  if (document.readyState === "complete") {
    initTabGroupPillListener();
  } else {
    window.addEventListener("load", initTabGroupPillListener, { once: true });
  }
})();
```

---

## 5. Architectural Comparison

### Summary Matrix

| Approach | Implementation Environment | Feasibility Rating |
| :--- | :--- | :--- |
| WebExtension Menu API | Standard Firefox Sandbox | [PASS] Supported via member tab |
| WebExtension tabGroups | Standard Firefox Sandbox | [PASS] Supported via popup/sidebar |
| WebExtension Pill Hook | Standard Firefox Sandbox | [FAIL] Blocked by security sandbox |
| `userChrome.js` Script | Privileged Browser Chrome | [PASS] Full DOM & event control |

### Detailed Feature Breakdown

* **Standard WebExtensions (AMO Compliant):**
  - Direct Pill Click Interception: [FAIL] No (browser chrome DOM blocked)
  - Custom Button on Native Bar: [FAIL] No (UI injection restricted)
  - Group Management via Member Tab: [PASS] Yes (via `tab.groupId`)
  - Programmatic Group Control: [PASS] Yes (via `browser.tabGroups`)
  - AMO Distributable: [PASS] Yes

* **Privileged Chrome Scripts (`userChrome.js` / Autoconfig):**
  - Direct Pill Click Interception: [PASS] Yes (via `addEventListener`)
  - Custom Button on Native Bar: [PASS] Yes (DOM element injection)
  - Group Management via Member Tab: [PASS] Yes (direct Gecko APIs)
  - Programmatic Group Control: [PASS] Yes (`gBrowser.tabGroups`)
  - AMO Distributable: [FAIL] No (requires local profile config)

---

## 6. Conclusions & Recommendations

1. **If your goal is an official WebExtension (installable from addons.mozilla.org):**
   - You **cannot** intercept left-clicks on the pill or inject a button directly into the pill.
   - You **can** achieve full functional parity by adding a context menu item to tabs inside that group (detecting `tab.groupId`), or by offering a custom sidebar panel (like Sidebery or Tree Style Tab) where you control the group pill DOM entirely.

2. **If your goal is local browser customization for yourself:**
   - Use `userChrome.js` / autoconfig. It grants 100% control over the native `.tab-group-label` element, allowing custom buttons, custom click listeners, and full access to `gBrowser.tabGroups`.
