# 🧠 DeepSift Dynamic Research Memory (DRM) Manual

**Version**: 2.0
**Target**: AI Agents & Systems
**Sub-system**: Cognitive Persistence & Context Management

Dynamic Research Memory (DRM) is your **persistent brain**. Without it, you are stateless between tool calls. DRM stores structured research data, automatically captures search results, and injects your findings into implementation plans.

**DRM IS MANDATORY.** You must open a tag before starting any research.

---

## 1. 🏷️ `deepsift memo open/close` (Tag Lifecycle)

**Usage:**
```bash
deepsift memo open "auth-system-deep-analysis"
# ... do research ...
deepsift memo close "auth-system-deep-analysis"
```

### 💡 Agent Rules:
- **ALWAYS OPEN A TAG FIRST:** If you run `deepsift search` without an open tag, the results are lost forever.
- **Semantic Naming:** Tags must be descriptive (e.g., `grid-styling-refactor`). Generic names like `temp` or `task1` are rejected by the engine.
- **Close when done:** Always close the tag when the task or investigation is complete. It remains queryable, but stops auto-saving new searches.

---

## 2. ⚡ The Auto-Save Protocol

When you have an open tag, DeepSift **automatically** intercepts and saves data from these commands:
- `deepsift search` (Captures the query, number of hits, top file paths, and snippets)
- `deepsift read` (Captures the file path and context)

You do **not** need to manually save search results. Just run the commands.

---

## 3. 📝 `deepsift memo add` (Manual Insights)

Auto-save captures raw data. You must manually add your interpreted insights, decisions, and bug fixes.

**Usage:**
```bash
deepsift memo add "auth-system-deep-analysis" --data "Decision: Use JWT in httpOnly cookies because of XSS risks." --type "decision"
deepsift memo add "auth-system-deep-analysis" --data "Bug found: Missing null check in LoginHandler.ts." --type "error_solution"
```

### 💡 Entry Types:
| Type | When to use |
|---|---|
| `finding` | Raw discovery from code analysis |
| `code_snippet` | Important code pattern worth remembering |
| `architecture_note` | Structural insight about how modules connect |
| `decision` | Why you chose approach A over B |
| `error_solution` | Bug fix, workaround, or resolution |
| `reference` | Link or external resource |
| `api_response` | API structure, endpoint pattern |

---

## 4. 🕵️ `deepsift memo query/show/graph` (Memory Recall)

Before writing a report or a plan, you MUST query your memory instead of relying on your LLM context window.

**Usage:**
```bash
# Query a specific tag
deepsift memo query "auth-system-deep-analysis" "token validation flow"

# Query across all historical tags
deepsift memo query --all "how did we fix the redis timeout?"

# See statistics for a tag
deepsift memo show "auth-system-deep-analysis"

# View the semantic relationship graph of your findings
deepsift memo graph "auth-system-deep-analysis"
```

---

## 5. 📤 `deepsift memo export` (Report Generation)

When you need to deliver a final report to the user, export the tag.

**Usage:**
```bash
deepsift memo export "auth-system-deep-analysis"
```

It generates a highly structured, comprehensive markdown report containing all auto-saved searches, files read, and manual insights grouped by type.
