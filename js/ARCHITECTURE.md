# JS Module Architecture

> Generated: 2026-05-12  
> Matches: 01_MASTER_DESIGN_EN.md §3-1

```
js/
├── app.js                      # Entry point (thin orchestrator, ~1550L) ✅ REFACTORED
├── bedrock_normalize.js        # Bedrock ID normalization utility
├── block_catalog.js            # Block catalog data
├── image2dot.js                # Image-to-dot-art conversion
├── mapcolors.js                # Map color palette
├── replacements.js             # Block replacement rules
├── resourcepack.js             # Resource pack loader
│
├── core/
│   ├── project-manager.js      # ProjectManager class (CRUD & Persistence)  ✅ EXTRACTED
│   ├── state.js                # Global app state                            🔲 STUB
│   └── events.js               # Global event bus                            🔲 STUB
│
├── io/
│   ├── nbt-reader.js           # NBT parsing (LE, from original nbt.js)      ✅ MOVED
│   ├── nbt-writer.js           # NBT generation (BE, Java-compatible)         🔲 STUB
│   ├── export-utils.js         # CSV / Markdown / mcstructure export          ✅ EXTRACTED
│   ├── mcstructure.js          # Bedrock .mcstructure parser                  🔲 STUB
│   ├── litematic.js            # Litematic export (ZYX→YZX, bit-packing)     🔲 STUB
│   └── worker.js               # Web Worker entry point                       ✅ MOVED
│
├── processing/
│   ├── merge.js                # Coordinate merging                           🔲 STUB
│   ├── invert.js               # Excavation guide generation                  🔲 STUB
│   ├── scaffold.js             # Scaffold optimization                        🔲 STUB
│   └── light-patch.js          # Hidden light source patching                 🔲 STUB
│
├── render/
│   ├── viewer3d.js             # 3D coordinator (Three.js r128)               ✅ MOVED
│   ├── orientation.js          # Direction tables, readers, Euler rotations   ✅
│   ├── orientation_stairs.js   # Stair corner shape calculation               ✅
│   ├── direction-test-scene.js # Visual harness (?dirtest=1 / __dirTest())     ✅
│   ├── block-mesh.js           # Block mesh & material gen                    ✅ MOVED
│   ├── textures.js             # Texture management                           ✅ MOVED
│   └── scene.js                # Scene / Camera / Light management            🔲 STUB
│
└── ui/
    ├── ui_events.js            # DOM/Events/Modal/Toast/Tour (UIMixin)        ✅ EXTRACTED
    ├── panels/
    │   ├── dotart.js           # Dot-art panel                                ✅ MOVED
    │   ├── materials.js        # Materials panel                              🔲 STUB
    │   └── viewer.js           # 3D viewer panel                              🔲 STUB
    └── components/
        ├── toast.js            # Toast notifications                          🔲 STUB
        ├── modal.js            # Modal dialogs                                🔲 STUB
        └── loading.js          # Loading overlay                              🔲 STUB
```

## Module Boundaries

| Layer | File(s) | Depends On |
|---|---|---|
| Entry | `app.js` | core/, io/, ui/, render/ |
| Data | `core/project-manager.js` | `bedrock_normalize.js` |
| Export | `io/export-utils.js` | `io/nbt-reader.js` |
| UI/Events | `ui/ui_events.js` | core/, io/, render/, replacements, block_catalog |
| 3D | `render/viewer3d.js` | Three.js |

## Legend
- ✅ DONE — real code, wired up
- 🔲 STUB — `// TODO` placeholder, Phase 2+
