/**
 * @file docgen.ts
 * @description DeepSift Automated Documentation Generator Engine.
 * Parses source code metadata, CLI commands, TSDoc comments, and architecture topology
 * to generate and update full documentation suites for GitHub users and AI Agents.
 * 
 * @module cli/commands/docgen
 * @category Documentation
 * @since 1.0.3
 */

import fs from 'fs';
import path from 'path';
import { printInfo, printSuccess, printError, OutputFormat } from '../cli-output.js';
import { normalizePath } from '../../utils/outline.js';
import { getFullCliCommandRegistry, buildFullCommandsMarkdown, buildFullApiReferenceMarkdown } from './docgen-helpers.js';

/**
 * Interface representing metadata extracted from a CLI Command.
 */
export interface CliCommandMetadata {
    name: string;
    aliases: string[];
    summary: string;
    usage: string;
    options: { flag: string; description: string }[];
    category: 'Core Search & Discovery' | 'Architecture & Intelligence' | 'Refactoring & Self-Healing' | 'Security & Diagnostics' | 'Memory & Realms' | 'Utilities & Dashboard';
    example: string;
}

/**
 * Interface representing extracted TSDoc module documentation.
 */
export interface TSDocModuleMetadata {
    filePath: string;
    moduleName: string;
    description: string;
    exports: {
        name: string;
        kind: 'function' | 'class' | 'interface' | 'type' | 'const';
        description: string;
        params?: { name: string; type: string; description: string }[];
        returns?: string;
        example?: string;
    }[];
}

/**
 * Executes the `deepsift docgen` command to parse the codebase and regenerate all documentation artifacts.
 * 
 * @param projectPath Absolute path to the root workspace directory.
 * @param format Output format ('markdown' or 'json').
 * @example
 * ```ts
 * await docgenCommand(process.cwd(), 'markdown');
 * ```
 */
export async function docgenCommand(projectPath: string, format: OutputFormat = 'markdown'): Promise<void> {
    try {
        printInfo('🔍 DeepSift DocGen Engine: Scanning codebase for JSDoc/TSDoc metadata and CLI commands...');

        const commands = extractCliCommands();
        const modules = scanTsDocModules(projectPath);

        const docsDir = path.join(projectPath, 'docs');
        if (!fs.existsSync(docsDir)) {
            fs.mkdirSync(docsDir, { recursive: true });
        }

        const commandsMd = buildFullCommandsMarkdown(commands);
        fs.writeFileSync(path.join(docsDir, 'COMMANDS.md'), commandsMd, 'utf-8');

        const architectureMd = generateArchitectureMarkdown(projectPath);
        fs.writeFileSync(path.join(docsDir, 'ARCHITECTURE.md'), architectureMd, 'utf-8');

        const apiRefMd = buildFullApiReferenceMarkdown(modules);
        fs.writeFileSync(path.join(docsDir, 'API_REFERENCE.md'), apiRefMd, 'utf-8');

        const agentGuideMd = generateAgentGuideMarkdown(commands);
        fs.writeFileSync(path.join(docsDir, 'AGENT_GUIDE.md'), agentGuideMd, 'utf-8');

        const readmeMd = generateReadmeMarkdown(commands);
        fs.writeFileSync(path.join(projectPath, 'README.md'), readmeMd, 'utf-8');
        
        const corePackageReadme = path.join(projectPath, 'packages', 'deepsift-core', 'README.md');
        if (fs.existsSync(path.dirname(corePackageReadme))) {
            fs.writeFileSync(corePackageReadme, readmeMd, 'utf-8');
        }

        const readmeFaMd = generateReadmeFaMarkdown(commands);
        fs.writeFileSync(path.join(docsDir, 'README_FA.md'), readmeFaMd, 'utf-8');

        syncAgentDirectives(projectPath, commands);

        if (format === 'json') {
            console.log(JSON.stringify({ status: 'success', commandsCount: commands.length, modulesCount: modules.length }, null, 2));
        } else {
            printSuccess(`\n✅ DeepSift Documentation Suite successfully generated & indexed:`);
            printInfo(`  - 📄 README.md (Root Landing Page)`);
            printInfo(`  - 📄 docs/README_FA.md (Persian Documentation)`);
            printInfo(`  - 📄 docs/COMMANDS.md (${commands.length} Commands Documented)`);
            printInfo(`  - 📄 docs/ARCHITECTURE.md (System Architecture & Pipeline)`);
            printInfo(`  - 📄 docs/API_REFERENCE.md (${modules.length} TS Modules Documented)`);
            printInfo(`  - 📄 docs/AGENT_GUIDE.md (AI Agent System Manual)`);
            printInfo(`  - ⚡ Synced Agent Directives (templates/agent-instructions.md & .agents/rules/deepsift.md)`);
        }
    } catch (err: any) {
        printError(`Failed to generate documentation: ${err.message}`);
        throw err;
    }
}

/**
 * Extracts comprehensive CLI command definitions and usage metadata.
 */
export function extractCliCommands(): CliCommandMetadata[] {
    return getFullCliCommandRegistry();
}

/**
 * Scans TypeScript source files and extracts TSDoc metadata.
 */
export function scanTsDocModules(projectPath: string): TSDocModuleMetadata[] {
    let srcDir = path.join(projectPath, 'packages', 'deepsift-core', 'src');
    if (!fs.existsSync(srcDir)) {
        srcDir = path.join(projectPath, 'src');
    }
    if (!fs.existsSync(srcDir)) return [];

    const modules: TSDocModuleMetadata[] = [];
    const files = walkFilesSync(srcDir, ['.ts']);

    for (const file of files) {
        if (file.endsWith('.test.ts') || file.endsWith('.d.ts')) continue;
        const relPath = normalizePath(path.relative(projectPath, file));
        const content = fs.readFileSync(file, 'utf-8');

        const fileDocMatch = content.match(/\/\*\*[\s\S]*?@file[\s\S]*?\*\//);
        let moduleDescription = 'TypeScript source module.';
        if (fileDocMatch) {
            const descMatch = fileDocMatch[0].match(/@description\s+(.*)/);
            if (descMatch) moduleDescription = descMatch[1].trim();
        }

        const exportMatches = content.matchAll(/\/\*\*([\s\S]*?)\*\/\s*export\s+(async\s+)?(function|class|interface|type|const)\s+([A-Za-z0-9_]+)/g);
        const exportsList: TSDocModuleMetadata['exports'] = [];

        for (const match of exportMatches) {
            const docBlock = match[1];
            const kind = match[3] as TSDocModuleMetadata['exports'][0]['kind'];
            const name = match[4];

            let description = 'Exported symbol.';
            const descLines = docBlock.split('\n')
                .map(l => l.replace(/^\s*\* ?/, '').trim())
                .filter(l => l.length > 0 && !l.startsWith('@') && !l.startsWith('import ') && !l.startsWith('/'));
            if (descLines.length > 0) description = descLines[0];

            exportsList.push({
                name,
                kind,
                description
            });
        }

        modules.push({
            filePath: relPath,
            moduleName: path.basename(file, '.ts'),
            description: moduleDescription,
            exports: exportsList
        });
    }

    return modules;
}

/**
 * Generates markdown documentation for system architecture.
 */
function generateArchitectureMarkdown(projectPath: string): string {
    return `# 🏛️ DeepSift Clean Architecture & System Engine

DeepSift is a high-performance **Semantic Codebase Search, AST Graph Analysis, and Self-Healing Engine** engineered for both AI Coding Agents and Human Developers.

---

## 📐 Core Architecture Overview

DeepSift operates on a modular, decoupled Clean Architecture physically dividing components into discrete layers:

\`\`\`mermaid
graph TD
    CLI[CLI Entry Point / Server] --> Analyzers[AST & Intelligence Analyzers]
    CLI --> Core[Indexer & Embedder]
    CLI --> Graphify[Graphify Community Engine]
    CLI --> DRM[Dynamic Research Memory (DRM)]
    Core --> Storage[Native SQLite / Key-Value Store]
    Core --> Parsers[Tree-Sitter Multilingual AST Parsers]
    Core --> Zig[Zig Native High-Density Renderer]
\`\`\`

---

## 🧬 Key Architectural Engines

### 1. Hybrid Semantic & Graphify Search Engine
Combines **BM25 lexical search** with **Vector embeddings** and **Graphify PageRank RRF (Reciprocal Rank Fusion)**. Central God Nodes and top-connected functions are automatically scored and boosted in search results.

### 2. Tree-Sitter AST Structural Analyzer
Parses TypeScript, JavaScript, Python, Dart, and Go source code into AST scope blocks to extract exact function signatures, exported classes, call graphs, control flow branches (CFG), and dependency maps.

### 3. DEC_v2 Visual Token Compressor
Compresses terminal text outputs by 30-50% using DEC_v2 visual tokens and native Zig rendering (\`deepsift-math.exe\`), preventing context window explosion in AI Agent prompts.

### 4. Dynamic Research Memory (DRM Engine)
Provides persistent, tag-based research memory (\`deepsift memo\`) enabling AI agents to track active investigation states, decision logs, and architectural findings across multiple steps and sessions.

### 5. Self-Healing & Structural Patching Engine
Provides AST-safe code refactoring (\`deepsift refactor\`), dry-run simulations, security scanners (CWE vulnerabilities, sandbox boundary leaks), and autonomous self-healing loops (\`deepsift auto-heal\`).
`;
}

/**
 * Generates AI Agent Integration Manual.
 */
function generateAgentGuideMarkdown(commands: CliCommandMetadata[]): string {
    return `# 🤖 DeepSift AI Agent Integration Guide

This guide details how AI Coding Agents (Antigravity, Claude, Gemini, Cursor) must interact with **DeepSift**.

---

## 🛑 MANDATORY RULE FOR AGENTS

When working in a DeepSift-enabled repository, **AI Agents MUST EXCLUSIVELY use DeepSift CLI commands** via terminal execution for project exploration, searching, dependency tracing, reading files, and applying patches.

---

## 🎯 Recommended Agent Workflow

1. **Step 1: Auto-Discovery & Overview**
   Run \`deepsift overview --depth 3\` to get a high-level project map, central God Nodes, and feature outlines.

2. **Step 2: Conceptual Search**
   Use \`deepsift search "concept"\` to locate relevant files and functions.

3. **Step 3: Precise Scope Reading**
   Use \`deepsift read "file:start-end"\` to inspect exact code lines before editing.

4. **Step 4: Dependency & Impact Check**
   Use \`deepsift impact "SymbolName"\` or \`deepsift deps "file"\` to check breaking changes before modifying code.

5. **Step 5: Persistent Research Tagging (DRM Engine)**
   Open a research tag before beginning a multi-step task:
   \`\`\`bash
   deepsift memo open "task-name"
   deepsift memo add "Discovered critical configuration pattern in config.ts"
   deepsift memo close "task-name"
   \`\`\`

6. **Step 6: High-Confidence Patching**
   Apply AST structural edits using \`deepsift patch "patch.json"\` or native IDE replace tools.

7. **Step 7: Automated Re-Verification**
   Run \`deepsift doctor\` or build checks to verify zero regressions.
`;
}

/**
 * Generates GitHub README.md landing page.
 */
function generateReadmeMarkdown(commands: CliCommandMetadata[]): string {
    return `# 🔍 DeepSift Core

> **High-Performance Semantic Codebase Search, AST Graph Analysis, and Self-Healing Engine for AI Agents & Developers**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![License](https://img.shields.io/badge/license-ISC-blue.svg)]()
[![Version](https://img.shields.io/badge/version-1.0.3-orange.svg)]()

DeepSift is an enterprise-grade codebase intelligence engine. It combines **Tree-Sitter AST parsing**, **BM25 + Vector Hybrid Search**, **Graphify PageRank algorithms**, **DEC_v2 Token Compression**, and a **Dynamic Research Memory (DRM)** engine to provide lightning-fast, highly accurate context for AI agents and software engineers.

---

## ✨ Features at a Glance

- 🚀 **Super-Commands (\`overview\`, \`analyze\`):** Single-step blueprint combining directory trees, God Nodes, and AST feature signatures.
- 🎯 **Hybrid Semantic & Graphify Search:** Combines BM25 lexical search with Graphify PageRank boosting for God Nodes.
- 🧬 **Project DNA & Topology:** Automatically discovers core architecture patterns, clean layer boundaries, and state stores.
- 🧠 **Dynamic Research Memory (DRM):** Persistent research note-taking engine (\`deepsift memo\`) tracking multi-step agent investigations.
- ⚡ **DEC_v2 Token Compressor:** Reduces terminal output token volume by 30-50% using high-density visual tokens and native Zig rendering.
- 🛡️ **Self-Healing & Security Scan:** AST-safe symbol renaming, dry-run patching, CWE vulnerability scanning, and autonomous auto-healing.
- 📚 **Automated DocGen Engine (\`deepsift docgen\`):** Self-updating documentation system that regenerates Markdown docs on every build.

---

## 📦 Quick Start

### Installation

\`\`\`bash
npm install -g deepsift
# or inside monorepo
pnpm add deepsift
\`\`\`

### Basic Commands

\`\`\`bash
# Initialize DeepSift in your repository
deepsift init

# Project Overview & Blueprint
deepsift overview

# Semantic Code Search
deepsift search "authentication state store"

# AST Feature Signature Outline
deepsift feature "src/core"

# Regenerate Documentation
deepsift docgen
\`\`\`

---

## 🛠️ Complete CLI Command Suite

DeepSift features **${commands.length} powerful CLI commands**. For detailed options and usage examples, refer to [docs/COMMANDS.md](docs/COMMANDS.md).

| Command | Category | Description |
|---|---|---|
${commands.map(c => `| \`deepsift ${c.name}\` | ${c.category} | ${c.summary} |`).join('\n')}

---

## 📚 Documentation Index

- 📄 [CLI Commands Manual](docs/COMMANDS.md)
- 📄 [System Architecture & Clean Engine](docs/ARCHITECTURE.md)
- 📄 [TSDoc Source Code API Reference](docs/API_REFERENCE.md)
- 📄 [AI Agent Integration Manual](docs/AGENT_GUIDE.md)
- 📄 [Persian Guide (راهنمای فارسی)](docs/README_FA.md)

---

## 📄 License

ISC License © DeepSift Team
`;
}

/**
 * Generates Persian README_FA.md documentation.
 */
function generateReadmeFaMarkdown(commands: CliCommandMetadata[]): string {
    return `# 🔍 موتور جستجوی هوشمند و تحلیل کد DeepSift (راهنمای فارسی)

> **ابزار پیشرفته جستجوی معنایی، تحلیل گراف AST، و خودترمیمی کد برای ایجنت‌های هوش مصنوعی و توسعه‌دهندگان**

---

## ✨ قابلیت‌های کلیدی

- 🚀 **دستورات فوق‌العاده (\`overview\` و \`analyze\`):** ارائه یک‌باره نقشه راه معماری، گره‌های اصلی (God Nodes) و خصوصیات AST.
- 🎯 **جستجوی ترکیبی Semantic + Graphify:** ترکیب الگوریتم BM25 و Vector Search با رتبه‌بندی PageRank برای اولویت‌دهی به کدهای حساس.
- 🧠 **حافظه تحقیقاتی پویا (DRM Engine):** مدیریت نشانه‌ها و یادداشت‌های تحقیقاتی ایجنت در طول مراحل توسعه (\`deepsift memo\`).
- ⚡ **فشرده‌سازی توکن DEC_v2:** کاهش ۳۰ تا ۵۰ درصدی حجم توکن خروجی ترمینال با رندر بومی Zig.
- 🛡️ **خودترمیمی و بازرسی امنیت:** تغییر نام ایمن نمادها، بررسی آسیب‌پذیری‌های امنیتی (CWE) و حلقه خودکار رفع باگ (\`deepsift auto-heal\`).
- 📚 **مستندسازی خودکار (\`deepsift docgen\`):** به‌روزرسانی خودکار تمام فایل‌های مستندات گیت‌هاب با هر بار بیلد پروژه.

---

## 🚀 راهنمای سریع استفاده

\`\`\`bash
# مقداردهی اولیه پروژه
deepsift init

# مشاهده نقشه معماری و گره‌های اصلی پروژه
deepsift overview

# جستجوی معنایی در کدها
deepsift search "مدیریت وضعیت احراز هویت"

# تولید خودکار مستندات
deepsift docgen
\`\`\`

---

## 📚 فهرست مستندات

- 📄 [راهنمای جامع دستورات CLI](COMMANDS.md)
- 📄 [معماری سیستم و موتور Clean Engine](ARCHITECTURE.md)
- 📄 [مرجع کدها و APIها (API Reference)](API_REFERENCE.md)
- 📄 [راهنمای ایجنت‌های هوش مصنوعی](AGENT_GUIDE.md)
`;
}

/**
 * Synchronizes prompt directives in agent template files.
 */
function syncAgentDirectives(projectPath: string, commands: CliCommandMetadata[]): void {
    const templateFile = path.join(projectPath, 'packages', 'deepsift-core', 'templates', 'agent-instructions.md');
    const agentRuleFile = path.join(projectPath, '.agents', 'rules', 'deepsift.md');

    const directiveHeader = `---
trigger: always_on
---

# 🔍 DeepSift Visual Directive & Mastery (AUTOMATED SYNC)

You have access to **DeepSift**, a powerful local semantic search engine and codebase manipulation toolset.

## 🛠 Available DeepSift Commands (${commands.length} Commands)

| Command | Description |
|---|---|
${commands.map(c => `| \`deepsift ${c.name}${c.aliases.length ? ' (' + c.aliases.join(', ') + ')' : ''}\` | **${c.category.toUpperCase()}:** ${c.summary} |`).join('\n')}

## 📋 ABSOLUTE & NON-NEGOTIABLE USAGE RULES
1. **🔍 SMART SEARCH STRATEGY:** Start with \`deepsift search "query"\` for conceptual questions.
2. **📖 PRE-EDIT READING:** Before editing ANY file, read exact lines with \`deepsift read "file:start-end"\`.
3. **✏️ EDITING MANDATE:** Apply code changes using \`deepsift patch "patch.json"\` or native replace tools.
4. **🧠 DRM RESEARCH MEMORY:** Use \`deepsift memo open "tag"\` and \`deepsift memo add\` to track active research notes.
5. **📚 DOCUMENTATION GENERATION:** Run \`deepsift docgen\` whenever adding new features to update all documentation automatically.
`;

    if (fs.existsSync(path.dirname(templateFile))) {
        fs.writeFileSync(templateFile, directiveHeader, 'utf-8');
    }
    if (fs.existsSync(path.dirname(agentRuleFile))) {
        fs.writeFileSync(agentRuleFile, directiveHeader, 'utf-8');
    }
}

/**
 * Synchronously walks a directory to find files matching extensions.
 */
function walkFilesSync(dir: string, extensions: string[]): string[] {
    let results: string[] = [];
    if (!fs.existsSync(dir)) return results;

    const list = fs.readdirSync(dir);
    for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat && stat.isDirectory()) {
            if (file === 'node_modules' || file === 'dist' || file === '.deepsift' || file === '.git') continue;
            results = results.concat(walkFilesSync(fullPath, extensions));
        } else {
            const ext = path.extname(file).toLowerCase();
            if (extensions.includes(ext)) {
                results.push(fullPath);
            }
        }
    }

    return results;
}
