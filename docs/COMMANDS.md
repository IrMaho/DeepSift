# 🛠️ DeepSift CLI Commands Reference Manual

Comprehensive, production-grade manual for all **32 CLI commands** available in DeepSift.

This manual provides exhaustive details on command execution, parameter options, real-world AI Agent scenarios, and output formats.

---

## 📌 Core Search & Discovery

### `deepsift overview` (Aliases: `ov`)

**Summary:** SUPER-COMMAND: Single-step Project Blueprint combining Architecture Tree + Central God Nodes + Feature Summaries.

#### 📋 Usage Syntax
```bash
deepsift overview [path] [--depth N] [--compress] [--json]
```

#### ⚙️ Command Options & Flags
| Flag | Description |
|---|---|
| `--depth <number>` | Max directory traversal depth (default: 2) |
| `--compress` | Enable DEC_v2 visual token compression for context window efficiency |
| `--json` | Output structural blueprint in JSON format |

#### 💡 Concrete Example
```bash
deepsift overview --depth 3 --compress
```

---

### `deepsift search` (Aliases: `s`)

**Summary:** Hybrid Semantic & BM25 search enhanced with Graphify PageRank and God Node boosting.

#### 📋 Usage Syntax
```bash
deepsift search "query" [options]
```

#### ⚙️ Command Options & Flags
| Flag | Description |
|---|---|
| `--include, -i <path>` | Narrow search scope to specific subdirectory |
| `--sync` | Synchronize vector index before executing search |
| `--layer <ui|domain|data>` | Filter search results by Clean Architecture layer |
| `--verbose, -v` | Display real-time indexing progress and processing speed |
| `--context-lines, -C <N>` | Include N surrounding lines of code in match snippets |
| `--realm <id>` | Search within a mounted external knowledge realm |
| `--all-realms` | Search simultaneously across all mounted knowledge realms |
| `--limit <number>` | Limit number of search match results returned (default: 8) |
| `--no-compress` | Disable DEC_v2 token compression output |

#### 💡 Concrete Example
```bash
deepsift search "auth store login" --include "src/features/auth" --context-lines 5 --limit 10
```

---

### `deepsift read`

**Summary:** Mandatory file reader outputting exact text or compressed DEC_v2 visual tokens.

#### 📋 Usage Syntax
```bash
deepsift read "file:start-end" [--no-compress] [--json]
```

#### ⚙️ Command Options & Flags
| Flag | Description |
|---|---|
| `--no-compress` | Output uncompressed raw file text instead of DEC_v2 tokens |
| `--json` | Output content and line metadata in JSON format |

#### 💡 Concrete Example
```bash
deepsift read "src/utils/config.ts:1-50"
```

---

### `deepsift feature` (Aliases: `f`)

**Summary:** AST-based feature outline detailing class definitions, exported functions, and dependencies.

#### 📋 Usage Syntax
```bash
deepsift feature "path" [options]
```

#### ⚙️ Command Options & Flags
| Flag | Description |
|---|---|
| `--compact, -c` | High-density purpose & dependency outline |
| `--summary, -s` | Summary mode showing top-level exports only |
| `--group-by-feature, -g` | Group files by sub-feature directories |
| `--depth <number>` | Max directory traversal depth |
| `--limit <number>` | Max items per page for pagination |
| `--offset <number>` | Pagination offset index |

#### 💡 Concrete Example
```bash
deepsift feature "src/core" --summary --compact
```

---

## 📌 Architecture & Intelligence

### `deepsift analyze` (Aliases: `an`)

**Summary:** SUPER-COMMAND: Deep dive combining Feature AST Outline and DNA topology for a specific folder/file.

#### 📋 Usage Syntax
```bash
deepsift analyze "path" [--depth N] [--compact] [--json]
```

#### ⚙️ Command Options & Flags
| Flag | Description |
|---|---|
| `--depth <number>` | Max directory traversal depth |
| `--compact` | High-density summary output |
| `--json` | Output structural analysis in JSON format |

#### 💡 Concrete Example
```bash
deepsift analyze "src/memo" --depth 2
```

---

### `deepsift arch`

**Summary:** Project directory blueprint utilizing Graphify communities and automatic noise pruning.

#### 📋 Usage Syntax
```bash
deepsift arch [--depth N] [--json] [--plain]
```

#### ⚙️ Command Options & Flags
| Flag | Description |
|---|---|
| `--depth <number>` | Max directory tree depth (default: 3) |
| `--json` | Output directory graph structure in JSON format |
| `--plain` | Output clean plain text without Markdown formatting |

#### 💡 Concrete Example
```bash
deepsift arch --depth 4
```

---

### `deepsift dna`

**Summary:** Generates or displays Project DNA topology, central God Nodes, and community clusters.

#### 📋 Usage Syntax
```bash
deepsift dna [--show] [options]
```

#### ⚙️ Command Options & Flags
| Flag | Description |
|---|---|
| `--show` | Display existing cached DNA topology without re-indexing |
| `--force` | Force full recalculation of project DNA and community clusters |
| `--section <name>` | Filter DNA section (tokens, architecture, conventions) |
| `--query, -q <term>` | Search DNA JSON data by keyword |
| `--path-filter <path>` | Filter DNA records by file path prefix |
| `--meta` | Output metadata and record counts only |

#### 💡 Concrete Example
```bash
deepsift dna --show --section architecture
```

---

### `deepsift calltree`

**Summary:** Traces upstream callers, downstream callee scopes, and event message flows for any symbol.

#### 📋 Usage Syntax
```bash
deepsift calltree "symbol" [options]
```

#### ⚙️ Command Options & Flags
| Flag | Description |
|---|---|
| `--path <dir>` | Filter call graph scope to a specific subdirectory |
| `--compress` | Apply DEC_v2 visual token compression |
| `--json` | Output call graph hierarchy in JSON format |

#### 💡 Concrete Example
```bash
deepsift calltree "TokenOptimizerService" --path "src/utils"
```

---

### `deepsift cfg`

**Summary:** Control Flow Graph extractor generating Mermaid and ASCII branch diagrams for functions.

#### 📋 Usage Syntax
```bash
deepsift cfg "file:func" [--json]
```

#### ⚙️ Command Options & Flags
| Flag | Description |
|---|---|
| `--json` | Output Control Flow Graph nodes and edge lists in JSON |

#### 💡 Concrete Example
```bash
deepsift cfg "src/utils/config.ts:loadConfig"
```

---

### `deepsift deps`

**Summary:** Trace inbound and outbound dependencies for a specific file or module target.

#### 📋 Usage Syntax
```bash
deepsift deps "target" [--incoming] [--outgoing] [--graph]
```

#### ⚙️ Command Options & Flags
| Flag | Description |
|---|---|
| `--incoming` | Trace inbound callers depending on target |
| `--outgoing` | Trace outbound modules imported by target |
| `--graph` | Render dependency tree graph |

#### 💡 Concrete Example
```bash
deepsift deps "src/core/indexer.ts" --incoming
```

---

### `deepsift wire-trace`

**Summary:** Maps cross-environment message flows (postMessage, IPC, WebSockets, EventEmitters).

#### 📋 Usage Syntax
```bash
deepsift wire-trace [directory] [--json]
```

#### ⚙️ Command Options & Flags
| Flag | Description |
|---|---|
| `--json` | Output message wire trace channel matrix in JSON |

#### 💡 Concrete Example
```bash
deepsift wire-trace "src/figma-core"
```

---

## 📌 Refactoring & Self-Healing

### `deepsift clones`

**Summary:** AST Code Clone Detector highlighting duplicate blocks and copy-paste clusters for DRY compliance.

#### 📋 Usage Syntax
```bash
deepsift clones [path] [--min-tokens N] [--json]
```

#### ⚙️ Command Options & Flags
| Flag | Description |
|---|---|
| `--min-tokens <number>` | Minimum token threshold for clone detection (default: 30) |
| `--json` | Output clone clusters in JSON format |

#### 💡 Concrete Example
```bash
deepsift clones "src/analyzers"
```

---

### `deepsift find-dead-code` (Aliases: `dead-code`)

**Summary:** Scans for unreferenced exports, dead variables, and uncalled component functions.

#### 📋 Usage Syntax
```bash
deepsift find-dead-code [path] [--json]
```

#### ⚙️ Command Options & Flags
| Flag | Description |
|---|---|
| `--json` | Output unreferenced symbols list in JSON format |

#### 💡 Concrete Example
```bash
deepsift find-dead-code
```

---

### `deepsift check-schema-drift` (Aliases: `schema-drift`)

**Summary:** Audits schema and DOM selector synchronization between client UI and backend definitions.

#### 📋 Usage Syntax
```bash
deepsift check-schema-drift [--json]
```

#### ⚙️ Command Options & Flags
| Flag | Description |
|---|---|
| `--json` | Output schema drift audit report in JSON format |

#### 💡 Concrete Example
```bash
deepsift check-schema-drift
```

---

### `deepsift heal`

**Summary:** DNA-based auto-refactoring engine that fixes lint, type, and architectural issues in a file.

#### 📋 Usage Syntax
```bash
deepsift heal "file" [--dry-run]
```

#### ⚙️ Command Options & Flags
| Flag | Description |
|---|---|
| `--dry-run` | Simulate auto-healing patches without modifying file on disk |

#### 💡 Concrete Example
```bash
deepsift heal "src/cli/cli-output.ts" --dry-run
```

---

### `deepsift auto-heal`

**Summary:** Autonomous 4-step healing loop (diff -> build check -> auto-patch -> re-verify).

#### 📋 Usage Syntax
```bash
deepsift auto-heal "file" [--max-attempts N]
```

#### ⚙️ Command Options & Flags
| Flag | Description |
|---|---|
| `--max-attempts <number>` | Maximum patch retry attempts (default: 3) |

#### 💡 Concrete Example
```bash
deepsift auto-heal "src/storage/native-store.ts"
```

---

### `deepsift patch`

**Summary:** Applies structural AST code injections using the TOON-Patch specification.

#### 📋 Usage Syntax
```bash
deepsift patch "patch.json" [options]
```

#### ⚙️ Command Options & Flags
| Flag | Description |
|---|---|
| `--dry-run` | Simulate patch application in memory |
| `--check-impact` | Trace breaking impact before writing to disk |
| `--scan-security` | Perform CWE security vulnerability audit |

#### 💡 Concrete Example
```bash
deepsift patch "patch.json" --dry-run
```

---

### `deepsift refactor`

**Summary:** AST-safe symbol renaming across codebase or function extraction.

#### 📋 Usage Syntax
```bash
deepsift refactor rename <old> <new> | deepsift refactor extract <file:lines> --name <func>
```

#### ⚙️ Command Options & Flags
| Flag | Description |
|---|---|
| `--name <functionName>` | Name of extracted function target |

#### 💡 Concrete Example
```bash
deepsift refactor rename "oldHelper" "newHelper"
```

---

### `deepsift impact`

**Summary:** Calculates breaking change risk score and lists caller sites before symbol modification.

#### 📋 Usage Syntax
```bash
deepsift impact "symbol" [--json]
```

#### ⚙️ Command Options & Flags
| Flag | Description |
|---|---|
| `--json` | Output breaking change impact report in JSON format |

#### 💡 Concrete Example
```bash
deepsift impact "NativeStore"
```

---

## 📌 Security & Diagnostics

### `deepsift complexity`

**Summary:** Calculates Cyclomatic & Cognitive Complexity heatmap highlighting high-risk refactor targets.

#### 📋 Usage Syntax
```bash
deepsift complexity [path] [--json]
```

#### ⚙️ Command Options & Flags
| Flag | Description |
|---|---|
| `--json` | Output complexity heatmap matrix in JSON format |

#### 💡 Concrete Example
```bash
deepsift complexity "src/core"
```

---

### `deepsift security-scan` (Aliases: `audit-sandbox`, `audit-secrets`, `audit-deps`)

**Summary:** Scans for sandbox boundary leaks (e.g. window in sandbox), hardcoded secrets, and XSS risks.

#### 📋 Usage Syntax
```bash
deepsift security-scan [--json]
```

#### ⚙️ Command Options & Flags
| Flag | Description |
|---|---|
| `--json` | Output vulnerability finding details in JSON format |

#### 💡 Concrete Example
```bash
deepsift security-scan
```

---

### `deepsift doctor`

**Summary:** Runs system health diagnostics, database index checks, and self-healing index repairs.

#### 📋 Usage Syntax
```bash
deepsift doctor [--repair]
```

#### ⚙️ Command Options & Flags
| Flag | Description |
|---|---|
| `--repair` | Automatically repair corrupt SQLite indexes or missing cache files |

#### 💡 Concrete Example
```bash
deepsift doctor --repair
```

---

### `deepsift testmap`

**Summary:** Maps source files to corresponding unit test files and identifies untested modules.

#### 📋 Usage Syntax
```bash
deepsift testmap [--lang <ts|dart|py|go>] [--untested-only]
```

#### ⚙️ Command Options & Flags
| Flag | Description |
|---|---|
| `--lang <ts|dart|py|go>` | Filter test mapping by programming language |
| `--untested-only` | Display only source modules lacking test coverage |

#### 💡 Concrete Example
```bash
deepsift testmap --lang ts --untested-only
```

---

### `deepsift git-churn`

**Summary:** Git Hotspot Heatmap combining commit frequency with code complexity to find churn hotspots.

#### 📋 Usage Syntax
```bash
deepsift git-churn [--limit N] [--json]
```

#### ⚙️ Command Options & Flags
| Flag | Description |
|---|---|
| `--limit <number>` | Top N churn hotspot files to display (default: 10) |
| `--json` | Output churn risk metric array in JSON format |

#### 💡 Concrete Example
```bash
deepsift git-churn --limit 15
```

---

## 📌 Memory & Realms

### `deepsift memo` (Aliases: `m`)

**Summary:** Dynamic Research Memory (DRM) engine for persisting active research tags and architectural notes.

#### 📋 Usage Syntax
```bash
deepsift memo <action> [tag] [options]
```

#### ⚙️ Command Options & Flags
| Flag | Description |
|---|---|
| `open <tag> [--desc "text"]` | Create and activate a research tag |
| `close <tag>` | Close an active research tag |
| `add <tag> --data "text" [--type type]` | Add research note entry |
| `query <tag> "query" [--topk N]` | Semantic search within research notes |
| `list [--open]` | List all active or archived research tags |
| `export <tag>` | Export research tag findings as Markdown |
| `to-plan <tag>` | Convert research tag notes directly into implementation_plan.md |

#### 💡 Concrete Example
```bash
deepsift memo open "auth-refactor" --desc "OAuth2 token flow redesign"
```

---

### `deepsift realm`

**Summary:** Manages external knowledge bases and external Swagger/Figma specs (list, add, mount, snapshot).

#### 📋 Usage Syntax
```bash
deepsift realm <action> [id] [options]
```

#### ⚙️ Command Options & Flags
| Flag | Description |
|---|---|
| `list` | List mounted knowledge realms |
| `add <id> --path <dir>` | Mount external directory as knowledge realm |
| `snapshot <id>` | Create persistent vector snapshot of realm |

#### 💡 Concrete Example
```bash
deepsift realm add "figma-spec" --path "../figma-docs"
```

---

### `deepsift compare`

**Summary:** Compares vector knowledge gaps and similarities between two knowledge realms.

#### 📋 Usage Syntax
```bash
deepsift compare <r1> <r2> [-q term]
```

#### ⚙️ Command Options & Flags
| Flag | Description |
|---|---|
| `-q <term>` | Filter vector comparison by topic query string |

#### 💡 Concrete Example
```bash
deepsift compare code docs -q "authentication"
```

---

## 📌 Utilities & Dashboard

### `deepsift context`

**Summary:** Generates pre-creation checklist with rules and design tokens before building components.

#### 📋 Usage Syntax
```bash
deepsift context "path" [--json]
```

#### ⚙️ Command Options & Flags
| Flag | Description |
|---|---|
| `--json` | Output pre-creation rule checklist in JSON format |

#### 💡 Concrete Example
```bash
deepsift context "src/components/Header.tsx"
```

---

### `deepsift plan`

**Summary:** Generates structured implementation plans based on DNA, skills, realms, and architecture.

#### 📋 Usage Syntax
```bash
deepsift plan "request" [--output <file>]
```

#### ⚙️ Command Options & Flags
| Flag | Description |
|---|---|
| `--output <file>` | Write generated implementation plan to target markdown file |

#### 💡 Concrete Example
```bash
deepsift plan "Add OAuth2 authentication flow"
```

---

### `deepsift plan-ui`

**Summary:** Generates visual UI specs layout, token palettes, spacing, and i18n rules.

#### 📋 Usage Syntax
```bash
deepsift plan-ui "request"
```

#### 💡 Concrete Example
```bash
deepsift plan-ui "User Profile Settings Dialog"
```

---

### `deepsift docgen` (Aliases: `docs`)

**Summary:** Generates and synchronizes complete Markdown documentation suite for GitHub and AI Agents.

#### 📋 Usage Syntax
```bash
deepsift docgen [--project <path>]
```

#### ⚙️ Command Options & Flags
| Flag | Description |
|---|---|
| `--project <path>` | Specify custom target project root directory |

#### 💡 Concrete Example
```bash
deepsift docgen
```

---

### `deepsift ui`

**Summary:** Launches local interactive Web Dashboard visualization on port 3333 for graph and DRM.

#### 📋 Usage Syntax
```bash
deepsift ui [--port N]
```

#### ⚙️ Command Options & Flags
| Flag | Description |
|---|---|
| `--port <number>` | Specify custom port number (default: 3333) |

#### 💡 Concrete Example
```bash
deepsift ui --port 3333
```

---

