# 🚀 DeepSift Smart Planning & Healing Manual

**Version**: 2.0
**Target**: AI Agents & Systems
**Sub-system**: Autonomous Orchestration & Refactoring

DeepSift can autonomously generate implementation blueprints and safely refactor dangerous God Nodes. 

---

## 1. 🏗️ `deepsift plan "request"` (Smart Planning Mandate)

When a user requests a new feature, you **MUST NOT** start coding immediately. You must generate and present a plan.

**Usage:**
```bash
deepsift plan "Build a new User Profile dashboard with settings"
```

### 💡 Agent Rules for Planning:
- **What it does:** `plan` cross-references the project DNA, matches skills, scans architecture risks, and extracts any open DRM tags to produce a milestone-based blueprint (`implementation_plan.md`).
- **Gold Standard Specification:** The generated plan MUST be extremely comprehensive (minimum 500 lines). It must contain:
  1. Precise architectural flows.
  2. Full class/file skeletons.
  3. Extensive error-handling schemas.
  4. Pixel-perfect visual descriptions for UI components (margins, colors, spacing).
- **User Approval:** Present the generated plan to the user. Only begin coding the milestones once the user approves.

---

## 2. 🩹 `deepsift heal "filepath"` (Architecture Healer)

If a file has grown too large (a "God Node") or contains spaghetti logic, DeepSift can orchestrate a safe refactor.

**Usage:**
```bash
deepsift heal "src/core/proxy.ts"
```

### 💡 Agent Rules for Healing:
- **Auto-Refactoring Workflow:**
  1. Run `deepsift heal <filepath>`.
  2. DeepSift will analyze the AST and propose a modular split (e.g., extracting 3 new files from the monolithic file).
  3. Present the proposed split to the user.
  4. Upon approval, extract the components using `deepsift patch` or native IDE tools.
- **Preserve Existing Capabilities:** When healing or refactoring, you MUST preserve:
  - RTL support (`dir` attributes, `isRtl`).
  - i18n translation functions (`t()`).
  - Accessibility attributes (`aria-label`).
  - Theme support (light/dark mode classes).

---

## 3. 🛠️ AI Regress Healer (Fixing Bad Edits)

If you generate code that breaks existing functionality or wrongly deletes code, do **NOT** blindly revert the entire file.

### 💡 Healer Command Workflow:
1. Run `deepsift com "git diff HEAD -- <filepath>"` to see EXACTLY what you broke in the file.
2. Run `deepsift com "git show HEAD:<filepath>"` if you need to read the complete original source code of the file before your changes.
3. Use this regression report to isolate the damaged segment.
4. Restore **ONLY** the damaged lines using `deepsift patch`, while keeping the newly generated features intact.
