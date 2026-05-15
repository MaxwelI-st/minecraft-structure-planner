/**
 * process.worker.js — Heavy Processing Pipeline (Web Worker)
 *
 * Architecture principles (01_MASTER_DESIGN §2, 02_TECHNICAL_REFERENCE §8):
 *  - This Worker owns ALL binary I/O, NBT parsing, ID conversion, and bit-packing.
 *  - Main thread is FORBIDDEN from doing any of the above.
 *  - Cross-thread data transfer uses Transferable Objects (zero-copy).
 *  - Progress is reported per-section via sendProgress() so the UI stays responsive.
 *
 * Supported task types (WorkerTask.type):
 *   PARSE_NBT         — Parse .mcstructure, extract metadata + block palette
 *   CONVERT_LITEMATIC — Full Bedrock → Java Litematic conversion pipeline
 *   MERGE_STRUCTURES  — Merge multiple structures into one coordinate space
 *   SCAFFOLD_GEN      — Scaffolding optimisation engine
 *   INVERT_GEN        — Excavation guide (Invert) generation
 */

import { NBTReader, TAG } from '../modules/stream/nbt-reader.js';

// ─────────────────────────────────────────────────────────────────────────────
// Response helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send a PROGRESS update to the main thread.
 * Never transfers a buffer — progress messages are lightweight value copies.
 *
 * @param {string}  taskId   - Matches the originating WorkerTask.taskId
 * @param {number}  progress - 0.0 – 1.0
 * @param {string}  stage    - Human-readable label, e.g. "Parsing block palette…"
 */
function sendProgress(taskId, progress, stage = '') {
  self.postMessage({
    type: 'PROGRESS',
    taskId,
    payload: { progress: Math.min(1, Math.max(0, progress)), stage },
  });
}

/**
 * Send a COMPLETE response to the main thread.
 * If `data` is an ArrayBuffer it is TRANSFERRED (zero-copy); the buffer becomes
 * detached in this Worker after postMessage returns — do not read it again.
 *
 * @param {string}       taskId
 * @param {ArrayBuffer|null} data      - Transferable result buffer (or null)
 * @param {object}       metadata      - Serialisable metadata (blockCount, dims, etc.)
 * @param {string[]}     [warnings=[]] - Non-fatal issues (unmapped blocks, etc.)
 */
function sendComplete(taskId, data, metadata, warnings = []) {
  const transferList = data instanceof ArrayBuffer ? [data] : [];
  self.postMessage(
    {
      type: 'COMPLETE',
      taskId,
      payload: { data: data ?? null, metadata: { ...metadata, warnings } },
    },
    transferList,
  );
}

/**
 * Send an ERROR response.  Never throws to the Worker global scope —
 * uncaught Worker exceptions produce an opaque ErrorEvent in the main thread
 * with no taskId, making them unroutable.
 *
 * @param {string} taskId
 * @param {Error|string} err
 */
function sendError(taskId, err) {
  const message = err instanceof Error
    ? `${err.name}: ${err.message}\n${err.stack ?? ''}`
    : String(err);

  self.postMessage({ type: 'ERROR', taskId, payload: { error: message } });
}

// ─────────────────────────────────────────────────────────────────────────────
// Task dispatcher
// ─────────────────────────────────────────────────────────────────────────────

self.onmessage = async (event) => {
  const { type, taskId, payload } = event.data ?? {};

  if (!taskId) {
    console.warn('process.worker: received message without taskId — ignoring.');
    return;
  }

  try {
    switch (type) {
      case 'PARSE_NBT':
        await handleParseNBT(taskId, payload);
        break;

      case 'CONVERT_LITEMATIC':
        await handleConvertLitematic(taskId, payload);
        break;

      case 'MERGE_STRUCTURES':
        await handleMergeStructures(taskId, payload);
        break;

      case 'SCAFFOLD_GEN':
        await handleScaffoldGen(taskId, payload);
        break;

      case 'INVERT_GEN':
        await handleInvertGen(taskId, payload);
        break;

      default:
        sendError(taskId, `Unknown task type: "${type}"`);
    }
  } catch (err) {
    // Catch-all: ensures every unhandled throw routes back to main thread
    // with the correct taskId rather than becoming an unroutable ErrorEvent.
    sendError(taskId, err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PARSE_NBT handler
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse a .mcstructure file and extract:
 *   - Structure dimensions [SX, SY, SZ]
 *   - World origin [ox, oy, oz]
 *   - Block palette (array of { name, states, version })
 *   - Total block count
 *
 * Does NOT materialise the full block index array — that is deferred to
 * CONVERT_LITEMATIC which processes blocks section-by-section.
 *
 * @param {string} taskId
 * @param {{ buffer: ArrayBuffer, config: object }} payload
 */
async function handleParseNBT(taskId, payload) {
  const { buffer, config = {} } = payload;
  const format = config.sourceFormat ?? 'mcstructure';

  sendProgress(taskId, 0.05, 'Initialising NBT reader…');

  const reader = new NBTReader(buffer, { format: 'bedrock' });
  const { bodyOffset } = reader.getRoot();

  sendProgress(taskId, 0.1, 'Reading structure metadata…');

  // ── Walk the root compound, extracting only what we need ──────────────────
  let dimensions = null;
  let worldOrigin = null;
  let palette = null;
  let blockCount = 0;

  for (const tag of reader.walkCompound(bodyOffset)) {
    switch (tag.name) {

      case 'size': {
        // TAG_List of three TAG_Int: [SX, SY, SZ]
        const { arr } = reader.readListArray(tag.value.offset);
        dimensions = arr.map(v => (typeof v === 'object' ? Number(v.value ?? v) : v));
        break;
      }

      case 'structure_world_origin': {
        const { arr } = reader.readListArray(tag.value.offset);
        worldOrigin = arr.map(v => (typeof v === 'object' ? Number(v.value ?? v) : v));
        break;
      }

      case 'structure': {
        // Descend into the structure compound to find palette + block count
        sendProgress(taskId, 0.3, 'Reading block palette…');
        const result = _parseStructureCompound(reader, tag.value.offset);
        palette    = result.palette;
        blockCount = result.blockCount;
        break;
      }
    }
  }

  if (!dimensions) throw new Error('PARSE_NBT: could not find "size" tag in root compound.');
  if (!palette)    throw new Error('PARSE_NBT: could not find block palette in "structure" compound.');

  sendProgress(taskId, 0.95, 'Finalising metadata…');

  const metadata = {
    dimensions,
    worldOrigin: worldOrigin ?? [0, 0, 0],
    paletteSize: palette.length,
    blockCount,
    palette,   // Array<{ name: string, states: object, version: number }>
  };

  sendComplete(taskId, null, metadata);
}

/**
 * Walk the TAG_Compound('structure') and pull out palette + block count.
 * Does NOT read the full block_indices array — only counts it.
 *
 * @param {NBTReader} reader
 * @param {number} offset - First byte inside the structure compound payload
 * @returns {{ palette: Array, blockCount: number }}
 */
function _parseStructureCompound(reader, offset) {
  let palette    = null;
  let blockCount = 0;

  for (const tag of reader.walkCompound(offset)) {
    if (tag.name === 'block_indices') {
      // TAG_List containing two sub-lists (layer 0 + layer 1)
      // We only need the count from layer 0 — do NOT materialise the full array.
      blockCount = _countBlockIndices(reader, tag.value.offset);
    }

    if (tag.name === 'palette') {
      palette = _parsePaletteCompound(reader, tag.value.offset);
    }
  }

  return { palette: palette ?? [], blockCount };
}

/**
 * Count the number of block indices in layer 0 of the block_indices TAG_List.
 * Reads only the type + count integers — does not materialise any index values.
 */
function _countBlockIndices(reader, offset) {
  // block_indices is a TAG_List of two TAG_List entries (layer 0, layer 1)
  let count = 0;
  let i = 0;
  for (const listEntry of reader.walkList(offset)) {
    if (i === 0) {
      // listEntry.value is { __type: 'list', offset }
      // Peek into layer 0 to get its count without reading values
      const innerOffset = listEntry.value.offset;
      // element type byte
      const { next: afterType } = reader.readUByte(innerOffset);
      // count int32
      const { value: innerCount } = reader.readInt(afterType);
      count = innerCount;
    }
    i++;
    if (i >= 2) break; // only need first two layers
  }
  return count;
}

/**
 * Parse the TAG_Compound('palette') > TAG_Compound('default') > TAG_List('block_palette').
 * Returns an array of plain { name, states, version } objects.
 * These are small compounds (one per unique block type) — safe to materialise.
 */
function _parsePaletteCompound(reader, offset) {
  const palette = [];

  for (const tag of reader.walkCompound(offset)) {
    if (tag.name === 'default') {
      // Walk the 'default' sub-compound
      for (const defaultTag of reader.walkCompound(tag.value.offset)) {
        if (defaultTag.name === 'block_palette') {
          // TAG_List of TAG_Compound entries — one per palette entry
          for (const entry of reader.walkList(defaultTag.value.offset)) {
            const { obj } = reader.readCompoundObject(entry.value.offset);
            palette.push({
              name:    obj.name   ?? 'minecraft:air',
              states:  obj.states ?? {},
              version: typeof obj.version === 'number' ? obj.version : 0,
            });
          }
        }
      }
    }
  }

  return palette;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONVERT_LITEMATIC handler (Phase 2 stub — wired up, not yet implemented)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full Bedrock .mcstructure → Java .litematic conversion.
 * Implementation lives in Phase 2 (Milestone 2-B through 2-D).
 * Stub sends an immediate error so the main thread fails gracefully
 * rather than hanging on an unreturned Promise.
 */
async function handleConvertLitematic(taskId, payload) {
  // Phase 2 implementation will:
  //   1. Run sectionIterator() to stream blocks 16^3 at a time
  //   2. Convert each section's palette via be-to-je.js Map lookup
  //   3. Pack converted indices via bitpack.js (BigInt64Array, no-wrap rule)
  //   4. Assemble Litematic NBT tree via nbt-writer.js
  //   5. GZip compress with pako.gzip()
  //   6. sendComplete() with Transferable ArrayBuffer
  sendError(taskId, 'CONVERT_LITEMATIC not yet implemented — Phase 2 milestone.');
}

// ─────────────────────────────────────────────────────────────────────────────
// MERGE_STRUCTURES handler stub
// ─────────────────────────────────────────────────────────────────────────────

async function handleMergeStructures(taskId, payload) {
  sendError(taskId, 'MERGE_STRUCTURES not yet implemented — Phase 2 milestone.');
}

// ─────────────────────────────────────────────────────────────────────────────
// SCAFFOLD_GEN handler stub
// ─────────────────────────────────────────────────────────────────────────────

async function handleScaffoldGen(taskId, payload) {
  sendError(taskId, 'SCAFFOLD_GEN not yet implemented — Phase 3 milestone.');
}

// ─────────────────────────────────────────────────────────────────────────────
// INVERT_GEN handler stub
// ─────────────────────────────────────────────────────────────────────────────

async function handleInvertGen(taskId, payload) {
  sendError(taskId, 'INVERT_GEN not yet implemented — Phase 3 milestone.');
}

// ─────────────────────────────────────────────────────────────────────────────
// Section iterator (used by CONVERT_LITEMATIC in Phase 2)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generator: iterate all blocks in a structure's block_indices layer 0
 * in 16×16×16 virtual sections, yielding one Uint16Array per section.
 *
 * The Uint16Array is constructed fresh per section and discarded after the
 * caller processes it — this keeps heap pressure flat even for huge structures.
 *
 * Coordinate order: Bedrock ZYX — index = SZ*SY*x + SZ*y + z
 * (02_TECHNICAL_REFERENCE §2-2)
 *
 * @param {NBTReader} reader
 * @param {number}    indicesOffset  - Byte offset of the layer-0 TAG_List payload
 * @param {number[]}  dims           - [SX, SY, SZ]
 * @param {Function}  onProgress     - Called with (sectionsProcessed, totalSections)
 * @yields {{ section: Uint16Array, origin: [number,number,number], dims: [number,number,number] }}
 */
export function* sectionIterator(reader, indicesOffset, dims, onProgress) {
  const [SX, SY, SZ] = dims;
  const S = 16; // Section edge length
  const totalBlocks = SX * SY * SZ;

  // Read the entire layer-0 index list into a flat Int32Array for random access.
  // This IS a full read — but it's a typed array (4 bytes/block), not a JS object tree.
  // A 256×256×256 structure = 16 million blocks × 4 bytes = 64 MB.
  // For structures beyond this, a true streaming approach (cursor-per-index) is needed.
  // Phase 2 will add a streaming fallback when totalBlocks > STREAM_THRESHOLD.
  const STREAM_THRESHOLD = 4_000_000; // 4M blocks ≈ 16 MB — safe for browser heap

  let layer0;
  if (totalBlocks <= STREAM_THRESHOLD) {
    layer0 = _readLayer0Array(reader, indicesOffset, totalBlocks);
  } else {
    // For massive structures: cursor-based single-pass read (Phase 2 upgrade)
    // Currently falls back to the same approach with a console warning.
    console.warn(
      `sectionIterator: structure has ${totalBlocks} blocks (>${STREAM_THRESHOLD}). ` +
      'Consider chunked streaming for lower peak memory.'
    );
    layer0 = _readLayer0Array(reader, indicesOffset, totalBlocks);
  }

  const sectionsX = Math.ceil(SX / S);
  const sectionsY = Math.ceil(SY / S);
  const sectionsZ = Math.ceil(SZ / S);
  const totalSections = sectionsX * sectionsY * sectionsZ;
  let sectionsDone = 0;

  for (let bx = 0; bx < SX; bx += S)
  for (let by = 0; by < SY; by += S)
  for (let bz = 0; bz < SZ; bz += S) {
    const lx = Math.min(S, SX - bx);
    const ly = Math.min(S, SY - by);
    const lz = Math.min(S, SZ - bz);

    const section = new Uint16Array(lx * ly * lz);

    for (let x = 0; x < lx; x++)
    for (let y = 0; y < ly; y++)
    for (let z = 0; z < lz; z++) {
      // Bedrock ZYX flat index (02_TECHNICAL_REFERENCE §2-2)
      const globalIdx   = SZ * SY * (bx + x) + SZ * (by + y) + (bz + z);
      const sectionIdx  = lz * ly * x + lz * y + z;
      section[sectionIdx] = layer0[globalIdx] < 0 ? 0 : layer0[globalIdx];
    }

    sectionsDone++;
    if (onProgress) onProgress(sectionsDone, totalSections);

    yield {
      section,                  // Uint16Array — discard after processing
      origin: [bx, by, bz],
      dims:   [lx, ly, lz],
    };

    // Explicit null-out is not possible for a local variable inside a generator,
    // but the section goes out of scope after the caller's loop body runs,
    // making it immediately GC-eligible before the next section is allocated.
  }

  // Release the full layer0 array as soon as iteration is complete
  layer0 = null; // eslint-disable-line no-unused-vars
}

/**
 * Read layer 0 block indices from a TAG_List of TAG_Int into a flat Int32Array.
 * Reads directly from the DataView — does not build JS number objects.
 *
 * @param {NBTReader} reader
 * @param {number}    offset     - Byte offset of the TAG_List payload (element type byte)
 * @param {number}    totalBlocks
 * @returns {Int32Array}
 */
function _readLayer0Array(reader, offset, totalBlocks) {
  // block_indices is a TAG_List<TAG_List>: outer list has 2 elements (layer0, layer1).
  // We want the first inner list's raw int32 values.

  // Skip outer list header: 1 byte (elem type=TAG_List=9) + 4 bytes (count=2)
  const outerElemType = reader.readUByte(offset).value; // should be 9 (TAG_List)
  const afterOuterType = offset + 1;
  const afterOuterCount = afterOuterType + 4; // skip int32 count

  // Now at layer-0 TAG_List payload:
  // 1 byte elem type (should be 3 = TAG_Int) + 4 bytes count
  const layer0ElemType = reader.readUByte(afterOuterCount).value; // 3 = TAG_Int
  const { value: count, next: dataStart } = reader.readInt(afterOuterCount + 1);

  // Sanity check
  if (layer0ElemType !== TAG.INT) {
    throw new Error(
      `_readLayer0Array: expected TAG_Int elements (3), got type ${layer0ElemType}. ` +
      'block_indices layer 0 should be a list of integers.'
    );
  }

  // Read directly as Int32Array view (no copy if alignment allows, else copies)
  // The Bedrock file is Little-Endian but Int32Array is platform-endian.
  // We need to read each int32 via DataView to guarantee LE interpretation.
  const result = new Int32Array(count);
  for (let i = 0; i < count; i++) {
    result[i] = reader._view.getInt32(dataStart + i * 4, reader.le);
  }
  return result;
}
