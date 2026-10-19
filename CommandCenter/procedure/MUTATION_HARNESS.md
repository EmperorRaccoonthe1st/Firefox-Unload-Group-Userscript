# Mutation Harness Procedure

* **Project:** Firefox Tab Group Unloader
* **Standard:** Universal A-SDLC Mutation Protocol

---

## Mutation Engine Specification

### Engine Configuration
* **Engine:** AST-based JavaScript/Python mutant injector.
* **Target:** `src/unload_tab_group.uc.js`.
* **Execution Environment:** Subsecond Bytecode Shield (`-B`, `PYTHONDONTWRITEBYTECODE=1`).
* **Kill Threshold:** >= 80.0%.

### Verification Status
* In-browser live testing validated on Firefox 138+ desktop build.
