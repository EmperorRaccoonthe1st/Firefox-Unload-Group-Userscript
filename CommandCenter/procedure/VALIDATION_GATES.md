# Validation Gates Procedure

* **Project:** Firefox Tab Group Unloader
* **Standard:** Universal A-SDLC Validation Protocol

---

## Validation Gates Protocol

### Gate 0: Repository Hygiene & 5 Pillars
* **Command:** `cc-tool audit` or `cc-tool verify-gate 0`
* **Verification:** Validates 5 pillars (`CommandCenter/`, `src/`, `tests/`, `dist/`, `reports/`), specification files, and valid deliverable in `dist/`.

### Gate 1: Build & Syntax Integrity
* **Command:** `cc-tool verify-gate 1`
* **Verification:** Confirms JavaScript syntax and shell script execution permissions.

### Gate 2: Temporal Invariants Simulation
* **Command:** `cc-tool verify-gate 2`
* **Verification:** Confirms behavioral invariants defined in `CommandCenter/spec/invariants/catalog.md`.

### Gate 3: Substrate Harness
* **Command:** `cc-tool verify-gate 3`
* **Verification:** Verifies host platform integration and file existence.

### Gate 4: Mutation Hardening
* **Command:** `cc-tool verify-gate 4`
* **Verification:** Confirms AST mutation score threshold.
