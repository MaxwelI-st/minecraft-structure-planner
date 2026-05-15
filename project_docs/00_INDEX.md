# 📚 Minecraft Structure Planner — Documentation Index (v2.1)

> **AI Context**: Start here. This index tells you which document to read for any given task. Do not skip this step — the wrong document wastes tokens.

---

## 🗂️ Document Map

### 1. [`01_MASTER_DESIGN_EN.md`](01_MASTER_DESIGN_EN.md) / [`01_MASTER_DESIGN_JP.md`](01_MASTER_DESIGN_JP.md)
**The Constitution.** Vision, architecture principles, directory tree, Worker communication type interfaces, feature roadmap (Phases 1–5), AI prompt templates, and hallucination prevention checklist.
→ **Read when**: making architectural decisions, starting a new module, writing conversion logic.

### 2. [`02_TECHNICAL_REFERENCE.md`](02_TECHNICAL_REFERENCE.md)
**The Technical Bible.** Byte-level format specifications sourced from Bedrock Wiki, minecraft.wiki, litemapy docs, and the tryashtar mcstructure gist. Covers: `.mcstructure` NBT structure (with 8-byte header), ZYX coordinate math, `.litematic` bit-packing (no-wrap rule with working JS code), The Flattening mapping strategy, known block mapping landmines, scaffolding physics, and browser memory management patterns.
→ **Read when**: writing any binary I/O, implementing block ID conversion, hitting a "silent corruption" bug.

### 3. [`03_TODO.md`](03_TODO.md)
**The Implementation Roadmap.** Broken into concrete milestones with exact file paths, function signatures, and acceptance criteria. Not a vague feature wish-list — a step-by-step build guide for the AI.
→ **Read when**: starting a new session, determining the next task, checking implementation status.

---

## 🤖 AI Session Initialization Prompt

```markdown
# 🎯 Goal: Build Minecraft Structure Material Planner

Read and internalize these docs in order:
1. 00_INDEX.md (this file — the map)
2. 01_MASTER_DESIGN_JP.md (vision + architecture + type interfaces)
3. 02_TECHNICAL_REFERENCE.md (byte-level specs + code patterns)
4. 03_TODO.md (current milestone + acceptance criteria)

After reading, confirm: "Ready. Current milestone: [milestone name]. Next task: [task name]."
Then wait for my instruction.
```

---

## ⚡ Quick Reference: Most Common Implementation Questions

| Question | Answer (→ see doc for detail) |
| :--- | :--- |
| What endianness for .mcstructure? | **Little-Endian** (DataView `true`) → `02_TECHNICAL_REFERENCE §1-2` |
| Does .mcstructure have a header? | **Yes — 8-byte LE header** (version=8, payload size) → `02 §1-1` |
| What's the Bedrock block index formula? | `SZ*SY*X + SZ*Y + Z` (ZYX order) → `02 §2-2` |
| What's the Litematic index formula? | `y*|sz|*|sx| + z*|sx| + x` (YZX order) → `02 §3-4` |
| How does Litematic bit-packing work? | `entriesPerLong = floor(64/bpe)` — no wrap → `02 §3-2` |
| How to map Bedrock blocks to Java? | `Map<"name|sorted_states", JavaBlockState>` — GeyserMC source → `02 §4` |
| Where should heavy processing run? | **Web Worker only** — never in main thread → `01 §2` |
| What's the Worker message payload format? | `WorkerTask` / `WorkerResponse` interfaces → `01 §4` |
| What files do I edit for rendering? | `js/render/viewer3d.js`, `scene.js`, `block-mesh.js` → `01 §3-1` |
| Which phase should I implement next? | Check `03_TODO.md` for the first unchecked milestone |

---

## 📁 Source File Locations
| Module | Path |
| :--- | :--- |
| Entry point | `js/main.js` |
| Process Worker | `js/workers/process.worker.js` |
| Mapping Worker | `js/workers/mapping.worker.js` |
| NBT Reader | `js/modules/stream/nbt-reader.js` |
| NBT Writer | `js/modules/stream/nbt-writer.js` |
| BE→JE Mapping | `js/modules/mapping/be-to-je.js` |
| Bit-packing | `js/modules/logic/bitpack.js` |
| Scaffolding | `js/modules/logic/scaffold.js` |
| Three.js Preview | `js/render/viewer3d.js` |

---
*Last Updated: 2026-05-13 (v2.1)*
