# DeepSift Monorepo Architecture (V2)

## Overview
DeepSift has been successfully restructured into a specialized Monorepo to support both lightweight semantic/textual search and heavy multimodal (PixelRAG) vision-based indexing.

## Structure
- **`packages/deepsift-core`**: The original Node.js/TypeScript based DeepSift project. Handles MCP connections, IDE integrations, and lightweight textual vector search.
- **`packages/deepsift-vision`**: The PixelRAG Python project. Responsible for rendering, chunking, and embedding visual codebase segments into FAISS indices using HuggingFace models.
- **`models/`**: Central storage for large language/vision models (e.g. `Qwen3-VL-Embedding-2B`). This avoids re-downloading models across different environments and keeps them decoupled from the source code.
- **`deepsift-workspace.yml`**: A new global configuration file that controls how DeepSift behaves based on system capabilities.

## Configuration Guide (`deepsift-workspace.yml`)
You can tweak the performance and behavior of DeepSift based on your hardware capabilities:

### For Weaker Systems (Text-only Mode)
If your system lacks a powerful GPU or sufficient RAM to run vision models:
```yaml
deepsift:
  core:
    enabled: true
    mode: "text-semantic"
  vision:
    enabled: false  # <--- DISABLING VISION PREVENTS QWEN FROM LOADING
```
This forces DeepSift to rely entirely on `deepsift-core` without loading the 2B vision model into memory.

### For Stronger Systems (Multimodal Combined Mode)
If you have adequate RAM/VRAM:
```yaml
deepsift:
  core:
    enabled: true
    mode: "hybrid"
  vision:
    enabled: true
    mode: "pixelrag"
    model_path: "./models/Qwen3-VL-Embedding-2B"
    backend: "faiss"
```
In this mode, `deepsift-core` can query the FAISS database built by `deepsift-vision` to return visual codebase insights alongside text.

## Next Steps
Now that the foundational structure is established, we will move into `packages/deepsift-core` and `packages/deepsift-vision` to develop the bridge that allows DeepSift to route search queries automatically to the PixelRAG backend when `vision.enabled = true`.
