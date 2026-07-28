# Goal: Zero-Copy Memory-Mapped Disk Streaming (1000x Speedup)

Implement full zero-copy read/write streaming for the DeepSift `.zdb` caching system. Currently, the TypeScript bridge loads the entire compressed database into RAM, decompresses it into RAM, and writes it to a `.tmp` file before passing it to Zig. This causes severe memory spikes and slowness on large monorepos.

By removing `zlib` compression from the TypeScript layer and eliminating `.tmp` files, we can let Zig directly Memory-Map (`mmap`) the raw database file. This results in true zero-copy access where the CPU reads directly from SSD/NVMe without any RAM allocation overhead.

## User Review Required

> [!WARNING]
> **Storage Size Trade-off:** Removing `zlib` compression means the `cache.db` file will consume more disk space. However, it will drastically reduce RAM usage (near zero) and massively improve startup/indexing speed, especially for monorepos.

> [!IMPORTANT]
> **Migration Strategy:** The new system will automatically detect existing compressed databases on startup, decompress them via streaming to avoid RAM spikes, and rewrite them as raw, uncompressed `.zdb` files for future zero-copy access. 

## Proposed Changes

### packages/deepsift-core/src/storage/native-store.ts

#### [MODIFY] `native-store.ts`
- Remove all `zlib.gzipSync` and `zlib.gunzipSync` operations.
- Remove `.tmp` file creation and use `this.dbPath` directly.
- Implement a one-time stream-based decompression fallback for migrating old compressed `cache.db` files without loading them fully into RAM.
- Pass `this.dbPath` directly to `ZigBridge` in `executeAction`.
- Update `syncToDisk` and `syncGraphToDisk` to be no-ops (since Zig writes directly to the real DB path).

## Verification Plan

### Automated Tests
- Build the project (`npm run build`).
- Run indexing on a test repository and monitor RAM usage. It should stay near base Node.js consumption regardless of DB size.

### Manual Verification
- Verify that `cache.db` is directly modified.
- Run `deepsift search` and confirm search speed and index loading time are near-instantaneous.
