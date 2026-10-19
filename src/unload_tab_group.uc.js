// ==UserScript==
// @name         Unload All Tabs in Tab Group
// @description  Adds an "Unload all tabs" button to the Firefox Tab Group pill options menu
// @version      1.1.0
// @author       Antigravity
// @compatibility Firefox 138+
// @include      chrome://browser/content/browser.xhtml
// @include      main
// ==/UserScript==

(function() {
  "use strict";

  const BUTTON_ID = "tabGroupEditor_unloadAllTabs";
  const SEPARATOR_ID = "tabGroupEditor_unloadAllTabs_sep";

  // Clean up any stray buttons previously injected into window chrome
  function cleanupStrays() {
    const straySelectors = [
      "#tab-group-editor-unload-all",
      `#${BUTTON_ID}`,
      `#${SEPARATOR_ID}`
    ];
    for (const selector of straySelectors) {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        // Remove if not properly nested inside the edit actions container
        if (!el.closest(".tab-group-edit-actions")) {
          el.remove();
        }
      }
    }
  }

  function injectUnloadButton() {
    cleanupStrays();

    const editor = document.getElementById("tab-group-editor");
    if (!editor) {
      return;
    }

    // Locate the edit actions container strictly inside the panel
    const actionsContainer = editor.querySelector(".tab-group-edit-actions");
    if (!actionsContainer) {
      return;
    }

    // Check if the button is already cleanly installed
    if (actionsContainer.querySelector(`#${BUTTON_ID}`)) {
      return;
    }

    // 1. Create matching separator
    const sep = document.createXULElement
      ? document.createXULElement("toolbarseparator")
      : document.createElement("toolbarseparator");
    sep.id = SEPARATOR_ID;
    sep.className = "tab-group-edit-mode-only";

    // 2. Create the toolbarbutton matching native subviewbutton styling
    const unloadBtn = document.createXULElement
      ? document.createXULElement("toolbarbutton")
      : document.createElement("toolbarbutton");

    unloadBtn.id = BUTTON_ID;
    unloadBtn.className = "subviewbutton tab-group-edit-mode-only";
    unloadBtn.setAttribute("tabindex", "0");
    // CRITICAL: Set ONLY label attribute. Do NOT set textContent (causes duplicate text).
    unloadBtn.setAttribute("label", "Unload all tabs");

    // 3. Attach click handler
    unloadBtn.addEventListener("command", function onUnloadCommand(event) {
      event.stopPropagation();

      const group = editor.activeGroup;
      if (!group) {
        console.warn("[TabGroupUnload] No activeGroup found on editor.");
        return;
      }

      // Resolve member tabs for the active group
      const memberTabs = group.tabs
        ? Array.from(group.tabs)
        : Array.from(window.gBrowser.tabs).filter(t => t.group === group);

      // If active tab is inside this group, switch to an outside tab first so it can also be unloaded
      if (window.gBrowser && memberTabs.includes(window.gBrowser.selectedTab)) {
        const outsideTab = Array.from(window.gBrowser.visibleTabs).find(t => !memberTabs.includes(t));
        if (outsideTab) {
          window.gBrowser.selectedTab = outsideTab;
        }
      }

      let discardedCount = 0;

      // Discard background tabs in the group
      for (const tab of memberTabs) {
        if (window.gBrowser && tab !== window.gBrowser.selectedTab && !tab.selected) {
          try {
            window.gBrowser.discardBrowser(tab);
            discardedCount++;
          } catch (err) {
            console.error("[TabGroupUnload] Failed to discard tab:", err);
          }
        }
      }

      console.log(`[TabGroupUnload] Successfully unloaded ${discardedCount} tab(s) in group.`);

      // Close the tab group options menu
      if (typeof editor.close === "function") {
        editor.close();
      } else if (editor.panel && typeof editor.panel.hidePopup === "function") {
        editor.panel.hidePopup();
      }
    });

    // 4. Append inside .tab-group-edit-actions (after Delete group)
    actionsContainer.appendChild(sep);
    actionsContainer.appendChild(unloadBtn);
  }

  function init() {
    cleanupStrays();

    const editor = document.getElementById("tab-group-editor");
    if (editor) {
      // Try immediate injection if DOM is ready
      injectUnloadButton();

      // Ensure button is present whenever the popup opens
      editor.addEventListener("popupshowing", injectUnloadButton);
    }
  }

  if (document.readyState === "complete") {
    init();
  } else {
    window.addEventListener("load", init, { once: true });
  }
})();
