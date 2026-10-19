# System Invariants Catalog

* **Project:** Firefox Tab Group Unloader
* **Prefix:** `INV-`

---

## Invariant Catalog

### `INV-01: Tab Preservation Invariant`
* **Rule:** An unload action must never delete, close, or remove a `<tab>` element from the DOM.
* **Mechanism:** Reclaims content process memory via `gBrowser.discardBrowser(tab)` while leaving the tab placeholder visible in the tab strip.
* **Violation Condition:** Any decrease in `gBrowser.tabs.length` as a result of clicking "Unload all tabs".

### `INV-02: Group Membership Invariant`
* **Rule:** A discarded tab must retain its exact position, group membership (`tab.group`), container ID (`tab.cookieStoreId`), and session history.
* **Mechanism:** Gecko lazy-tab restoration retains session store metadata.
* **Violation Condition:** Any tab being ejected from its group or moving indexes upon unloading.

### `INV-03: Scope Isolation Invariant`
* **Rule:** Only tabs belonging to the active group being inspected (`editor.activeGroup`) may be targeted for unloading.
* **Mechanism:** Strict filtering against `editor.activeGroup.tabs`.
* **Violation Condition:** Any tab outside the target group undergoing `discardBrowser()`.

### `INV-04: Active Viewport Protection Invariant`
* **Rule:** A tab cannot be discarded while it is the currently visible and selected tab (`gBrowser.selectedTab`).
* **Mechanism:** If the selected tab belongs to the target group, focus shifts to a non-member tab before discarding. If no outside tabs exist, the active tab remains rendered while all peers are discarded.
* **Violation Condition:** Gecko content crash caused by discarding the active window viewport.

### `INV-05: DOM Idempotency Invariant`
* **Rule:** Repeatedly opening and closing the Tab Group options popup must never produce duplicate buttons or duplicate separators.
* **Mechanism:** Explicit presence check on `#tabGroupEditor_unloadAllTabs` prior to injection.
* **Violation Condition:** More than one instance of `#tabGroupEditor_unloadAllTabs` existing inside the document.

### `INV-06: Popup Enclosure Invariant`
* **Rule:** Injected buttons must reside strictly within `.tab-group-edit-actions` inside the popup `<panel>`. No elements may leak into `#mainPopupSet` or the window titlebar.
* **Mechanism:** Targeting `.tab-group-edit-actions` coupled with startup cleanup via `cleanupStrays()`.
* **Violation Condition:** Any element matching `#tabGroupEditor_unloadAllTabs` existing outside `<panel>`.
