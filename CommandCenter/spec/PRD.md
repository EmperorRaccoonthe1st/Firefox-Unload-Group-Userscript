# Product Requirements Document (PRD)

* **Project Name:** Firefox Tab Group Unloader (`unload_tab_group.uc.js`)
* **Version:** 1.1.0
* **Target Environment:** Mozilla Firefox 138+ (Desktop) via `userChrome.js` / `fx-autoconfig`

---

## 1. Problem Statement

Modern web browsing workflows accumulate dozens of tabs organized into native Firefox Tab Groups (such as research tasks, reference videos, or work tickets). While Tab Groups organize these tabs visually, inactive background tabs continue consuming significant RAM and system resources.

Standard Firefox only provides native options to rename, color-code, close, or ungroup tab groups. It does not provide a native one-click mechanism to hibernate or discard an entire tab group from memory without closing the tabs.

Furthermore, standard WebExtensions (such as Violentmonkey or extensions from AMO) cannot inject custom buttons into the native Tab Group pill context menu (`<tabgroup-menu id="tab-group-editor">`) due to browser chrome security sandboxing.

---

## 2. Solution Overview

`unload_tab_group.uc.js` is a privileged Firefox chrome script running via `fx-autoconfig` / `userChrome.js`. It seamlessly injects an **"Unload all tabs"** button into the native right-click options menu of any Tab Group pill (`.tab-group-label`).

When clicked, the script:
1. Resolves the active tab group and its member tabs.
2. Checks if the currently focused browser tab is inside the group; if so, cleanly shifts focus to an outside tab to ensure full group unloading.
3. Invokes Gecko's native `gBrowser.discardBrowser(tab)` engine on each tab, reclaiming content process memory while keeping the tabs, titles, favicons, containers, and group layout fully intact.
4. Dismisses the options popup.

---

## 3. Functional Requirements (FRs)

* **FR-01: Native Menu Integration:** The script must hook into `<tabgroup-menu id="tab-group-editor">` and inject the action button inside `.tab-group-edit-actions` strictly within the `<panel>` element.
* **FR-02: Single Clean Label:** The button must display only a single text label ("Unload all tabs") matching native Firefox theme styling.
* **FR-03: Scope Isolation:** The button must only affect tabs belonging to the target tab group that was right-clicked.
* **FR-04: Memory Reclamation:** Member tabs must be discarded using `gBrowser.discardBrowser()`, reducing active process memory to lazy placeholders.
* **FR-05: Window Chrome Protection:** The script must clean up any leaked or misplaced buttons outside the popup panel and ensure no elements leak into the window titlebar.
* **FR-06: Active Tab Focus Shift:** If the user executes the action on a group containing the active tab, the browser shifts focus to an outside tab if available, allowing the former active tab to be discarded.

---

## 4. Non-Functional Requirements (NFRs)

* **NFR-01: Zero Latency:** Popup injection must execute synchronously during `popupshowing` with zero noticeable UI lag (`< 5ms`).
* **NFR-02: Native Styling:** The injected button must reuse Firefox's internal `.subviewbutton` classes and design tokens.
* **NFR-03: Multi-Window Safety:** Each browser window instance manages its own popup injection without cross-window state collision.
* **NFR-04: Offline & Self-Contained:** The script requires zero external network dependencies, APIs, or background workers.
