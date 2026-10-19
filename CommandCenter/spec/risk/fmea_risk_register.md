# Failure Mode & Effects Analysis (FMEA) Risk Register

* **Project:** Firefox Tab Group Unloader
* **Standard:** Universal A-SDLC FMEA Risk Register

---

## Risk Analysis Register

### `RISK-01: Firefox Internal Selector Refactoring`
* **Failure Mode:** Future Firefox releases rename or restructure `.tab-group-edit-actions` or `#tabGroupEditor_deleteGroup`.
* **Root Cause:** Internal browser chrome markup is not a public stable API and is subject to Mozilla redesigns.
* **Severity:** Medium (button fails to appear in menu; browser operation unaffected).
* **Mitigation:** Fallback logic searches `.tab-group-edit-actions`, then `#tab-group-properties-and-actions`, then `.panel-subview-body`.

### `RISK-02: Single-Group Window Viewport Starvation`
* **Failure Mode:** User attempts to unload a group that contains all open tabs in the window.
* **Root Cause:** Firefox cannot discard the active tab if no alternate tab exists to focus.
* **Severity:** Low.
* **Mitigation:** The focus-shift check detects if an outside tab exists (`outsideTab = gBrowser.visibleTabs.find(...)`). If none exists, background tabs are discarded while the active tab safely remains active.

### `RISK-03: Accidental Button Titlebar Leakage`
* **Failure Mode:** Elements injected into `#tabgroup-menu` render at the top of the browser window.
* **Root Cause:** Direct children of `#mainPopupSet` that are not `<panel>` elements are treated as window chrome content.
* **Severity:** High (UI visual corruption).
* **Mitigation:** Enforced `cleanupStrays()` routine running at startup, combined with strict `actionsContainer` containment inside `<panel>`.

### `RISK-04: Multi-Window State Collision`
* **Failure Mode:** Interacting with tab groups across multiple open Firefox windows causes incorrect group resolution.
* **Root Cause:** Shared global references across window contexts.
* **Severity:** Medium.
* **Mitigation:** Script isolates all queries to window-local `window.gBrowser` and `document.getElementById()`.
