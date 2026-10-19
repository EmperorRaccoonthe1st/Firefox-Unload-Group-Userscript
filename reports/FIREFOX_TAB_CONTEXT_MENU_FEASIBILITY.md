# Feasibility Study: Firefox Extension Tab Context Menu Custom Button

* **Document Version:** 1.0.0
* **Status:** Complete [FEASIBLE]
* **Target Environment:** Firefox Desktop (Gecko WebExtensions MV2 / MV3)

---

## 1. Executive Summary

Building a Firefox extension that creates a custom item or action button inside the right-click context menu of a browser tab is **fully feasible** and natively supported by Mozilla Firefox.

Firefox is unique among modern desktop web browsers in exposing the `"tab"` context within the `browser.menus` (and `browser.contextMenus`) WebExtensions API. While Chromium-based browsers (Google Chrome, Microsoft Edge, Brave) explicitly omit tab context menu injection, Firefox has provided full native support since Firefox 53.

```text
┌─────────────────────────────────────────────────────────────────┐
│ FEASIBILITY VERDICT: [FEASIBLE]                                 │
│                                                                 │
│ - Standard Context Menu Action:  Natively Supported             │
│ - Submenus and Grouped Actions:  Natively Supported             │
│ - Dynamic Menu Updates:          Natively Supported             │
│ - Multi-Tab Selection Support:   Natively Supported             │
│ - Arbitrary HTML/DOM in Menu:    Unsupported (OS/Gecko native)  │
│ - Firefox for Android Support:   Unsupported                    │
└─────────────────────────────────────────────────────────────────┘
```

> **Important:** While a standard context menu item (clickable row with custom label and icon) is fully supported, WebExtensions cannot inject arbitrary HTML widgets (such as embedded sliders, toggle switches, or custom CSS buttons) directly inside the native browser context menu popup. All entries conform to the native operating system and Firefox theme presentation.

---

## 2. Technical Architecture & Firefox WebExtensions APIs

### 2.1 The `browser.menus` API
Firefox provides two interchangeable namespaces:
* `browser.menus`: Mozilla's preferred namespace. It provides full capabilities including menu icons, dynamic shown events, and bookmark/tools menu contexts.
* `browser.contextMenus`: Standard cross-browser alias. In Firefox, this functions as an alias to `browser.menus`.

### 2.2 The `"tab"` Context Type
When invoking `browser.menus.create()`, setting `contexts: ["tab"]` instructs Firefox to display the item exclusively when the user right-clicks a tab header on the tab strip.

Supported item types:
* `"normal"`: Standard clickable button row with title and optional icon.
* `"checkbox"`: Toggled binary setting with checkmark.
* `"radio"`: Mutually exclusive grouped setting.
* `"separator"`: Visual divider line.

### 2.3 Required Manifest Permissions

* **`"menus"`**: Mandatory permission to register and manipulate context menu entries.
* **`"activeTab"`**: Grants temporary access to the right-clicked tab's URL and title upon user interaction, even if that tab was in the background.
* **`"tabs"`** (Optional): Required only if your extension must read URLs, titles, or states of background tabs without waiting for a user click, or if querying tabs globally.

---

## 3. Interaction & Execution Workflow

The diagram below illustrates the complete lifecycle from extension initialization to click handling on a target tab.

```text
┌─────────────────────────────────────────────────────────────┐
│                 Extension Background Script                 │
└──────────────────────────────┬──────────────────────────────┘
                               │
                browser.runtime.onInstalled
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Register Context Menu Item                  │
│     browser.menus.create({ id, title, contexts: ["tab"] })  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                 User right-clicks browser tab
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Native Firefox Tab Strip                    │
│             Displays custom action in menu                  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                 User clicks custom menu item
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               browser.menus.onClicked Handler               │
│ - Receives `info` (click data)                              │
│ - Receives `tab` (target tab metadata)                      │
│ - Dispatches background task, script, or API action         │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Cross-Browser & Platform Compatibility Matrix

| Platform / Browser | Support Status | Technical Notes |
| :--- | :--- | :--- |
| Firefox Desktop | [PASS] Full Support | Native `contexts: ["tab"]` since Firefox 53 |
| Google Chrome | [FAIL] Unsupported | Chromium issue 54150; `tab` context omitted |
| Microsoft Edge | [FAIL] Unsupported | Follows Chromium contextMenu specification |
| Safari Desktop | [FAIL] Unsupported | Safari WebExtensions lack `tab` context |
| Firefox Android | [FAIL] Unsupported | `browser.menus` API not implemented on mobile |

> **Note:** If building a cross-browser extension, this specific tab context menu feature must be conditionally gated for Firefox, or paired with a fallback (such as an extension toolbar popup or keyboard shortcut) for Chrome and Edge.

---

## 5. Reference Implementation (Manifest V3)

The following minimal implementation demonstrates creating a custom button in the tab context menu that reads the tab's metadata and executes an action.

### 5.1 `manifest.json`

```json
{
  "manifest_version": 3,
  "name": "Tab Context Action",
  "version": "1.0.0",
  "description": "Adds a custom action to the Firefox tab context menu.",
  "permissions": [
    "menus",
    "activeTab"
  ],
  "background": {
    "scripts": ["background.js"]
  },
  "browser_specific_settings": {
    "gecko": {
      "id": "tab-action-addon@example.local",
      "strict_min_version": "109.0"
    }
  }
}
```

### 5.2 `background.js`

```javascript
/**
 * Tab Context Menu Extension for Firefox
 * Registers a custom action when right-clicking any tab.
 */

const MENU_ITEM_ID = "custom-tab-button";

// 1. Register menu entry on extension installation or update
browser.runtime.onInstalled.addListener(() => {
  browser.menus.create(
    {
      id: MENU_ITEM_ID,
      title: "Run Custom Tab Action",
      contexts: ["tab"],
      type: "normal"
    },
    () => {
      if (browser.runtime.lastError) {
        console.error("Menu creation error:", browser.runtime.lastError);
      } else {
        console.log("Tab context menu item registered successfully.");
      }
    }
  );
});

// 2. Handle user click on the tab context menu item
browser.menus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ITEM_ID) {
    return;
  }

  console.log(`Action triggered on tab ID: ${tab.id}`);
  console.log(`Tab Title: ${tab.title}`);
  console.log(`Tab URL: ${tab.url}`);

  // Example action: Duplicate or modify the right-clicked tab
  try {
    // Check if multiple tabs were highlighted (multi-selected)
    const highlightedTabs = await browser.tabs.query({
      currentWindow: true,
      highlighted: true
    });

    const targets = highlightedTabs.length > 1 ? highlightedTabs : [tab];

    for (const targetTab of targets) {
      console.log(`Processing tab ${targetTab.id}: ${targetTab.url}`);
      // Perform desired operation (e.g., reload, pin, bookmark, mute)
    }
  } catch (error) {
    console.error("Failed executing tab action:", error);
  }
});
```

---

## 6. Capabilities & Advanced Use Cases

### 6.1 Multi-Tab Selection Handling
Firefox supports multi-select tabs (holding `Ctrl` or `Shift` while clicking tabs). When a user right-clicks a highlighted tab group:
* `tab` in `onClicked` identifies the exact tab under the mouse cursor.
* `browser.tabs.query({ currentWindow: true, highlighted: true })` retrieves all highlighted tabs, enabling batch operations (e.g., batch mute, batch duplicate, batch move).

### 6.2 Dynamic Menu Titles and Visibility (`menus.onShown`)
Using `browser.menus.onShown`, the extension can inspect the tab state before rendering the menu and adjust options dynamically:

```javascript
browser.menus.onShown.addListener(async (info, tab) => {
  if (info.contexts.includes("tab") && tab) {
    const isPinned = tab.pinned;
    await browser.menus.update("custom-tab-button", {
      title: isPinned ? "Unpin and Archive Tab" : "Pin and Process Tab"
    });
    browser.menus.refresh();
  }
});
```

### 6.3 Firefox Multi-Account Containers
Firefox tabs contain a `cookieStoreId` attribute indicating the container context (e.g., Personal, Work, Banking). An extension can inspect `tab.cookieStoreId` and re-open the tab in another container or execute container-specific workflows.

### 6.4 Menu Overrides (`menus.overrideContext`)
For deep customization inside extension panels or custom tab sidebars (such as Tree Style Tab or Sidebery), `browser.menus.overrideContext({ context: "tab", showDefaults: false })` allows hiding all default browser entries to render only the extension's commands.

---

## 7. Limitations & Constraints

* **Native Menu Rendering:** Entries are styled by Firefox's internal XUL/Photon theme. Extensions cannot apply arbitrary CSS fonts, colors, padding, or inline HTML form controls to the context menu item.
* **Vertical Positioning:** WebExtensions cannot force an item to appear at a precise vertical index among native Firefox items (such as directly above "Close Tab"). Extension items are grouped into an extension block within the menu.
* **Icon Restrictions:** Top-level context menu entries display the extension's default icon. Custom per-item icons via the `icons` property are restricted to child items inside submenus.
* **Platform Scope:** Desktop only; mobile versions of Firefox do not expose the `menus` API.

---

## 8. Feasibility Conclusion & Next Steps

* **Technical Feasibility:** 100% [FEASIBLE] on Firefox Desktop.
* **Effort Estimate:** Low (prototype runnable in under 30 minutes; full production extension in 1 to 2 days).
* **Recommended Next Step:** Scaffold a minimal Manifest V3 extension, load it temporarily via `about:debugging` in Firefox Developer Edition or standard Firefox, and test the target tab action against background, pinned, and container tabs.
