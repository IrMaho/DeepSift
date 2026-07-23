# DeepSift Architecture (V2)

## Overview
DeepSift is structured as a high-performance Monorepo for text-semantic search, AST intelligence, and Model Context Protocol (MCP) server integration.

## Structure
- **`packages/deepsift-core`**: Node.js/TypeScript core engine. Handles MCP connections, IDE integrations, AST parsing, and vector search.
- **`deepsift-workspace.yml`**: Global workspace configuration file.

## Configuration Guide (`deepsift-workspace.yml`)
```yaml
deepsift:
  core:
    enabled: true
    mode: "text-semantic"
```
