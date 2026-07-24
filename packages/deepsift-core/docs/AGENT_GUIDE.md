# 🤖 DeepSift AI Agent Integration Guide

This guide details how AI Coding Agents (Antigravity, Claude, Gemini, Cursor) must interact with **DeepSift**.

---

## 🛑 MANDATORY RULE FOR AGENTS

When working in a DeepSift-enabled repository, **AI Agents MUST EXCLUSIVELY use DeepSift CLI commands** via terminal execution for project exploration, searching, dependency tracing, reading files, and applying patches.

---

## 🎯 Recommended Agent Workflow

1. **Step 1: Auto-Discovery & Overview**
   Run `deepsift overview --depth 3` to get a high-level project map, central God Nodes, and feature outlines.

2. **Step 2: Conceptual Search**
   Use `deepsift search "concept"` to locate relevant files and functions.

3. **Step 3: Precise Scope Reading**
   Use `deepsift read "file:start-end"` to inspect exact code lines before editing.

4. **Step 4: Dependency & Impact Check**
   Use `deepsift impact "SymbolName"` or `deepsift deps "file"` to check breaking changes before modifying code.

5. **Step 5: Persistent Research Tagging (DRM Engine)**
   Open a research tag before beginning a multi-step task:
   ```bash
   deepsift memo open "task-name"
   deepsift memo add "Discovered critical configuration pattern in config.ts"
   deepsift memo close "task-name"
   ```

6. **Step 6: High-Confidence Patching**
   Apply AST structural edits using `deepsift patch "patch.json"` or native IDE replace tools.

7. **Step 7: Automated Re-Verification**
   Run `deepsift doctor` or build checks to verify zero regressions.
