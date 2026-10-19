# Migration Roadmap

* **Project:** Firefox Tab Group Unloader
* **Status:** [COMPLETED]

---

## Phase Checklist

* [DONE] **Phase M0: Forensic Discovery & Structural Scaffolding**
  - Scaffolding the 5 pillars (`CommandCenter/`, `src/`, `tests/`, `dist/`, `reports/`).
  - Staging historical reports and screenshots.

* [DONE] **Phase M1: Ground-Up Specification Reconstruction**
  - Authoring `PRD.md`, `MASTER.md`, `catalog.md`, `fmea_risk_register.md`.

* [DONE] **Phase M2: In-Browser Verification & Refinement**
  - Live testing on Firefox 138+ with native Tab Groups.
  - Resolving titlebar leakage and label duplication.

* [DONE] **Phase M3: Structural Consolidation & Dist Linkage**
  - Verifying relative deliverable symlink in `dist/`.
  - Zero root pollution.

* [DONE] **Phase M4 & M5: Gate Audit & Final Sign-Off**
  - Validating repository hygiene via `cc-tool audit`.
  - Packaging repository for GitHub release.
