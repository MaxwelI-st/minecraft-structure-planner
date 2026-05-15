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

import { NBTReader, TAG }                       from '../modules/stream/nbt-reader.js';
import { NBTWriter, buildLitematic }             from '../modules/stream/nbt-writer.js';
import { packBlockStates, remapZYXtoYZX }        from '../modules/logic/bitpack.js';
import { BeToJeConverter }                       from '../modules/mapping/be-to-je.js';
import { invertStructure, hollowOut,
         applyLightPatch }                       from '../modules/logic/invert.js';
import { planScaffolding }                       from '../modules/logic/scaffold.js';
import { mergeStructures }                       from '../modules/logic/merge.js';

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

      case 'MERGE_AND_CONVERT_LITEMATIC':
        await handleMergeAndConvertLitematic(taskId, payload);
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
    if (tag.name !== 'default' || tag.value?.__type !== 'compound') continue;

    for (const defaultTag of reader.walkCompound(tag.value.offset)) {
      if (defaultTag.name !== 'block_palette' || defaultTag.value?.__type !== 'list') continue;

      for (const entry of reader.walkList(defaultTag.value.offset)) {
        if (entry.value?.__type !== 'compound') continue;

        // ⚠️ readCompoundObject は TAG_Compound 子フィールドをマーカー値
        // ({__type:'compound', offset}) で返してしまうため、`states` を手動で
        // ウォークして key→primitive value の平坦オブジェクトを構築する。
        let name = 'minecraft:air';
        let version = 0;
        const states = {};

        for (const field of reader.walkCompound(entry.value.offset)) {
          if (field.name === 'name') {
            name = field.value;
          } else if (field.name === 'version') {
            version = field.value;
          } else if (field.name === 'states' && field.value?.__type === 'compound') {
            // Bedrock の states 値は TAG_Byte / TAG_Int / TAG_String の primitive のみ
            for (const st of reader.walkCompound(field.value.offset)) {
              states[st.name] = st.value;
            }
          }
        }

        palette.push({ name, states, version });
      }
    }
  }

  return palette;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONVERT_LITEMATIC handler (Phase 2 stub — wired up, not yet implemented)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full Bedrock .mcstructure → Java .litematic conversion pipeline.
 *
 * Pipeline (02_TECHNICAL_REFERENCE §2, §3, §4, §8):
 *   1. Parse .mcstructure via nbt-reader.js (cursor-based, no full object tree)
 *   2. Convert Bedrock palette → Java BlockStatePalette via be-to-je.js
 *   3. Apply waterlogging from layer 1 indices
 *   4. Remap flat indices ZYX→YZX via bitpack.remapZYXtoYZX
 *   5. Bit-pack Java indices into LongArray via bitpack.packBlockStates (no-wrap)
 *   6. Assemble Litematic NBT via nbt-writer.buildLitematic
 *   7. GZip compress (pako or CompressionStream)
 *   8. sendComplete() with Transferable ArrayBuffer
 */
async function handleConvertLitematic(taskId, payload) {
  const { buffer, config = {} } = payload;

  // ── Step 1: Parse .mcstructure ──────────────────────────────────────────
  sendProgress(taskId, 0.02, 'Parsing .mcstructure…');
  const parsed = _parseMcStructureBuffer(buffer, taskId);
  if (!parsed.dimensions || !parsed.layer0Indices) {
    throw new Error('CONVERT_LITEMATIC: failed to extract structure data from NBT.');
  }

  await _convertParsedToLitematic(taskId, parsed, config);
}

/**
 * Helper: parse a single .mcstructure ArrayBuffer and return
 * { dimensions, worldOrigin, bedrockPalette, layer0Indices, layer1Indices }.
 */
function _parseMcStructureBuffer(buffer, taskId) {
  const reader      = new NBTReader(buffer, { format: 'bedrock' });
  const { bodyOffset } = reader.getRoot();

  let dimensions  = null;
  let worldOrigin = [0, 0, 0];
  let bedrockPalette = [];
  let layer0Indices  = null;
  let layer1Indices  = null;

  for (const tag of reader.walkCompound(bodyOffset)) {
    if (tag.name === 'size') {
      const { arr } = reader.readListArray(tag.value.offset);
      dimensions = arr;
    }
    if (tag.name === 'structure_world_origin') {
      const { arr } = reader.readListArray(tag.value.offset);
      worldOrigin = arr;
    }
    if (tag.name === 'structure') {
      if (taskId) sendProgress(taskId, 0.1, 'Reading block indices…');
      const p = _parseStructureForConversion(reader, tag.value.offset);
      bedrockPalette = p.palette;
      layer0Indices  = p.layer0;
      layer1Indices  = p.layer1;
    }
  }

  return { dimensions, worldOrigin, bedrockPalette, layer0Indices, layer1Indices };
}

/**
 * 共通の変換パイプライン（Step 2-8）。
 * 単一構造の変換でも、合体後の構造でも、ここを共有する。
 *
 * @param {string} taskId
 * @param {object} parsed - { dimensions, worldOrigin, bedrockPalette, layer0Indices, layer1Indices }
 * @param {object} config - { minecraftDataVersion, name }
 */
async function _convertParsedToLitematic(taskId, parsed, config = {}) {
  const dataVersion   = config.minecraftDataVersion ?? 3700;
  const structureName = config.name ?? 'converted';
  const { dimensions, worldOrigin, bedrockPalette, layer0Indices, layer1Indices } = parsed;

  const [SX, SY, SZ] = dimensions;
  const totalBlocks   = SX * SY * SZ;

  // ── Step 2: Load mapping Map ─────────────────────────────────────────────
  sendProgress(taskId, 0.15, 'Loading block mapping…');
  const mappingMap = await _loadMappingMap();

  // ── Step 3: Convert Bedrock palette → Java palette ──────────────────────
  sendProgress(taskId, 0.25, `Converting ${bedrockPalette.length} palette entries…`);
  const converter = new BeToJeConverter(mappingMap);
  const { javaPalette, beToJeIndexMap, warnings: paletteWarnings } =
    converter.convertPalette(bedrockPalette, layer1Indices, totalBlocks);

  // ── Step 4: Build flat Java index array (with waterlogging) ─────────────
  sendProgress(taskId, 0.35, 'Applying waterlogging…');
  let javaIndices;
  const hasWaterlogging = layer1Indices && layer1Indices.some(v => v !== -1);

  if (hasWaterlogging) {
    javaIndices = converter.applyWaterlogging(
      layer0Indices, layer1Indices, beToJeIndexMap, javaPalette
    );
  } else {
    javaIndices = new Uint16Array(totalBlocks);
    for (let i = 0; i < totalBlocks; i++) {
      const be0 = layer0Indices[i];
      javaIndices[i] = beToJeIndexMap[be0 < 0 ? 0 : be0];
    }
  }

  // ── Step 5: Remap ZYX → YZX coordinate order ────────────────────────────
  sendProgress(taskId, 0.50, 'Remapping coordinate order ZYX→YZX…');
  const yzxIndices = remapZYXtoYZX(javaIndices, SX, SY, SZ);
  javaIndices = null;

  // ── Step 6: Bit-pack into Litematic LongArray (no-wrap rule) ─────────────
  sendProgress(taskId, 0.65, `Bit-packing ${yzxIndices.length} blocks into LongArray…`);
  const longArray = packBlockStates(yzxIndices, javaPalette.length);

  // ── Step 7: Assemble Litematic NBT ───────────────────────────────────────
  sendProgress(taskId, 0.78, 'Assembling Litematic NBT…');
  const nbtBuffer = buildLitematic({
    name:        structureName,
    author:      'Minecraft Structure Planner',
    dataVersion,
    dimensions,
    palette:     javaPalette,
    blockStates: longArray,
  });

  // ── Step 8: GZip compress ────────────────────────────────────────────────
  sendProgress(taskId, 0.88, 'Compressing (GZip)…');
  const compressed = await _gzip(nbtBuffer);

  // ── Step 9: Done ─────────────────────────────────────────────────────────
  sendProgress(taskId, 0.99, 'Finalising…');

  const allWarnings = [...paletteWarnings];
  if (mappingMap.__loadFailed) {
    allWarnings.unshift('⚠️ ブロックマッピング JSON のロードに失敗。全ブロックが石にフォールバックしています。');
  }

  sendComplete(taskId, compressed, {
    blockCount:  totalBlocks,
    paletteSize: javaPalette.length,
    dimensions,
    worldOrigin,
    longArrayLength: longArray.length,
  }, allWarnings);
}

// ─────────────────────────────────────────────────────────────────────────────
// MERGE_AND_CONVERT_LITEMATIC handler — 複数構造を合体して .litematic 出力
// ─────────────────────────────────────────────────────────────────────────────

async function handleMergeAndConvertLitematic(taskId, payload) {
  const { structures: buffers = [], config = {} } = payload;
  if (buffers.length === 0) {
    throw new Error('MERGE_AND_CONVERT_LITEMATIC: no structure buffers provided.');
  }

  // 単一の場合は通常変換に流す
  if (buffers.length === 1) {
    return handleConvertLitematic(taskId, { buffer: buffers[0], config });
  }

  // ── Step 1: 各構造をパース ────────────────────────────────────────────
  sendProgress(taskId, 0.05, `Parsing ${buffers.length} structures…`);
  const parsedList = [];
  for (let i = 0; i < buffers.length; i++) {
    sendProgress(taskId, 0.05 + 0.15 * (i / buffers.length),
      `Parsing structure ${i + 1}/${buffers.length}…`);
    const p = _parseMcStructureBuffer(buffers[i], null);
    if (!p.dimensions || !p.layer0Indices) {
      throw new Error(`MERGE_AND_CONVERT_LITEMATIC: structure ${i + 1} の解析に失敗`);
    }
    parsedList.push({
      layer0:      p.layer0Indices,
      layer1:      p.layer1Indices,
      palette:     p.bedrockPalette,
      dimensions:  p.dimensions,
      worldOrigin: p.worldOrigin,
    });
  }

  // ── Step 2: マージ ────────────────────────────────────────────────────
  sendProgress(taskId, 0.22, `Merging ${parsedList.length} structures…`);
  const merged = mergeStructures(parsedList, { airOverwrites: false });

  // ── Step 3: マージ済みデータを共通パイプラインへ ────────────────────
  // mergeStructures は palette を merge.js の paletteKey で dedupe する。
  // 形式は bedrock パレットと同じ ({name, states, version}) なので
  // そのまま _convertParsedToLitematic に渡せる。
  await _convertParsedToLitematic(taskId, {
    dimensions:     merged.dimensions,
    worldOrigin:    merged.worldOrigin,
    bedrockPalette: merged.palette,
    layer0Indices:  merged.layer0,
    layer1Indices:  merged.layer1 ?? null,
  }, config);
}

// ── Helpers for CONVERT_LITEMATIC ───────────────────────────────────────────

/**
 * Parse the TAG_Compound('structure') for conversion:
 * returns palette entries + fully materialised layer0 and layer1 Int32Arrays.
 * Unlike PARSE_NBT, here we DO need the full index arrays for conversion.
 */
function _parseStructureForConversion(reader, offset) {
  let palette = [];
  let layer0  = null;
  let layer1  = null;

  for (const tag of reader.walkCompound(offset)) {

    if (tag.name === 'block_indices') {
      // TAG_List<TAG_List> — outer list of two inner lists
      let layerIdx = 0;
      for (const outerEntry of reader.walkList(tag.value.offset)) {
        // Each outerEntry.value is { __type: 'list', offset }
        const innerOffset = outerEntry.value.offset;

        // Read element type + count of the inner list
        const { value: elemType, next: afterElemType } = reader.readUByte(innerOffset);
        const { value: count,    next: dataStart }     = reader.readInt(afterElemType);

        const arr = new Int32Array(count);
        for (let i = 0; i < count; i++) {
          arr[i] = reader._view.getInt32(dataStart + i * 4, reader.le);
        }

        if (layerIdx === 0) layer0 = arr;
        if (layerIdx === 1) layer1 = arr;
        layerIdx++;
        if (layerIdx >= 2) break;
      }
    }

    if (tag.name === 'palette') {
      palette = _parsePaletteCompound(reader, tag.value.offset);
    }
  }

  return { palette, layer0, layer1 };
}

/**
 * Load the be→je mapping Map.
 * First call fetches and caches; subsequent calls return the cached Map.
 * Falls back to empty Map (all blocks → minecraft:stone) if fetch fails.
 */
let _cachedMappingMap = null;

async function _loadMappingMap() {
  if (_cachedMappingMap) return _cachedMappingMap;

  try {
    const response = await fetch('/data/be_to_je_block_mapping.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    _cachedMappingMap = new Map(Object.entries(json));
    console.log(`[process.worker] Loaded ${_cachedMappingMap.size} block mappings`);
  } catch (err) {
    console.error('[process.worker] mapping JSON load FAILED —', err);
    console.error('[process.worker] All blocks will fall back to minecraft:stone!');
    _cachedMappingMap = new Map();
    _cachedMappingMap.__loadFailed = true;
  }

  return _cachedMappingMap;
}

/**
 * GZip compress an ArrayBuffer.
 * Uses the native CompressionStream API (Chrome 80+, Firefox 113+, Safari 16.4+).
 * Falls back to a dynamic import of pako if CompressionStream is unavailable.
 *
 * @param {ArrayBuffer} buffer
 * @returns {Promise<ArrayBuffer>}
 */
async function _gzip(buffer) {
  if (typeof CompressionStream !== 'undefined') {
    const cs     = new CompressionStream('gzip');
    const writer = cs.writable.getWriter();
    writer.write(new Uint8Array(buffer));
    writer.close();

    const chunks = [];
    const reader = cs.readable.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const totalLen  = chunks.reduce((n, c) => n + c.length, 0);
    const outBuffer = new Uint8Array(totalLen);
    let   offset    = 0;
    for (const chunk of chunks) {
      outBuffer.set(chunk, offset);
      offset += chunk.length;
    }
    return outBuffer.buffer;

  } else {
    throw new Error('CompressionStream API is not available in this browser. Please use a modern browser (Chrome 80+, Firefox 113+, Safari 16.4+).');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MERGE_STRUCTURES handler
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Merge multiple .mcstructure ArrayBuffers into a single unified structure.
 *
 * payload.structures: ArrayBuffer[]  — one per .mcstructure file (Transferable)
 * payload.config.worldOrigins: [ox,oy,oz][]  — override world origins per buffer
 *   (if omitted, each structure's own structure_world_origin NBT tag is used)
 * payload.config.airOverwrites: boolean  — default false
 *
 * Returns a JSON-encoded MergeResult in result.data for the caller to display
 * or pass back into CONVERT_LITEMATIC.
 */
async function handleMergeStructures(taskId, payload) {
  const { structures: buffers = [], config = {} } = payload;
  const { worldOrigins, airOverwrites = false } = config;

  if (!buffers.length) {
    sendError(taskId, 'MERGE_STRUCTURES: no structure buffers provided.');
    return;
  }

  sendProgress(taskId, 0.05, `Parsing ${buffers.length} structure(s)…`);

  const parsed = [];

  for (let i = 0; i < buffers.length; i++) {
    sendProgress(taskId, 0.05 + 0.5 * (i / buffers.length),
      `Parsing structure ${i + 1} of ${buffers.length}…`);

    const reader      = new NBTReader(buffers[i], { format: 'bedrock' });
    const { bodyOffset } = reader.getRoot();

    let dimensions  = null;
    let worldOrigin = worldOrigins?.[i] ?? null;
    let palette     = [];
    let layer0      = null;
    let layer1      = null;

    for (const tag of reader.walkCompound(bodyOffset)) {
      if (tag.name === 'size') {
        const { arr } = reader.readListArray(tag.value.offset);
        dimensions = arr;
      }
      if (tag.name === 'structure_world_origin' && !worldOrigin) {
        const { arr } = reader.readListArray(tag.value.offset);
        worldOrigin = arr;
      }
      if (tag.name === 'structure') {
        const r = _parseStructureForConversion(reader, tag.value.offset);
        palette = r.palette;
        layer0  = r.layer0;
        layer1  = r.layer1;
      }
    }

    if (!dimensions || !layer0) {
      sendError(taskId, `MERGE_STRUCTURES: failed to parse structure ${i + 1}.`);
      return;
    }

    parsed.push({ layer0, layer1, palette, dimensions, worldOrigin: worldOrigin ?? [0, 0, 0] });
  }

  sendProgress(taskId, 0.6, 'Merging coordinate spaces…');

  const merged = mergeStructures(parsed, { airOverwrites });

  sendProgress(taskId, 0.85, 'Serialising merge result…');

  const json = JSON.stringify({
    dimensions:  merged.dimensions,
    worldOrigin: merged.worldOrigin,
    palette:     merged.palette,
    layer0:      Array.from(merged.layer0),
    layer1:      merged.layer1 ? Array.from(merged.layer1) : null,
    stats:       merged.stats,
  });
  const enc = new TextEncoder().encode(json);
  const buf = enc.buffer.slice(enc.byteOffset, enc.byteOffset + enc.byteLength);

  sendProgress(taskId, 0.99, 'Merge complete.');
  sendComplete(taskId, buf, {
    dimensions:     merged.dimensions,
    structureCount: parsed.length,
    paletteSize:    merged.palette.length,
    blockCount:     merged.dimensions[0] * merged.dimensions[1] * merged.dimensions[2],
    ...merged.stats,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SCAFFOLD_GEN handler stub
// ─────────────────────────────────────────────────────────────────────────────

async function handleScaffoldGen(taskId, payload) {
  const { config } = payload;
  const { targetBlocks, groundY = 0 } = config ?? {};

  if (!targetBlocks || targetBlocks.length === 0) {
    sendComplete(taskId, null, { scaffoldBlocks: [], buildSequence: [], stats: {} });
    return;
  }

  sendProgress(taskId, 0.1, `Computing standing positions for ${targetBlocks.length} blocks…`);
  const result = planScaffolding(targetBlocks, groundY);

  sendProgress(taskId, 0.99, 'Scaffold plan complete.');

  // Encode result as JSON bytes and transfer
  const json   = JSON.stringify(result);
  const enc    = new TextEncoder().encode(json);
  const buf    = enc.buffer.slice(enc.byteOffset, enc.byteOffset + enc.byteLength);

  sendComplete(taskId, buf, {
    totalScaffoldBlocks: result.scaffoldBlocks.length,
    pillarCount:         result.pillars.length,
    uncoveredCount:      result.uncoveredCount,
    ...result.stats,
  }, result.uncoveredCount > 0
    ? [`${result.uncoveredCount} blocks could not be reached — manual scaffold needed`]
    : []);
}

// ─────────────────────────────────────────────────────────────────────────────
// INVERT_GEN handler stub
// ─────────────────────────────────────────────────────────────────────────────

async function handleInvertGen(taskId, payload) {
  const { buffer, config = {} } = payload;
  const mode = config.mode ?? 'invert'; // 'invert' | 'hollow' | 'lightpatch'

  sendProgress(taskId, 0.05, 'Parsing structure for transformation…');

  const reader     = new NBTReader(buffer, { format: 'bedrock' });
  const { bodyOffset } = reader.getRoot();

  let dimensions = null, bedrockPalette = [], layer0 = null;

  for (const tag of reader.walkCompound(bodyOffset)) {
    if (tag.name === 'size') {
      const { arr } = reader.readListArray(tag.value.offset);
      dimensions = arr;
    }
    if (tag.name === 'structure') {
      const parsed = _parseStructureForConversion(reader, tag.value.offset);
      bedrockPalette = parsed.palette;
      layer0         = parsed.layer0;
    }
  }

  if (!dimensions || !layer0) {
    throw new Error('INVERT_GEN: could not extract structure data.');
  }

  const [SX, SY, SZ] = dimensions;
  const indices16 = new Uint16Array(layer0.length);
  for (let i = 0; i < layer0.length; i++) {
    indices16[i] = layer0[i] < 0 ? 0 : layer0[i];
  }

  sendProgress(taskId, 0.35, `Applying "${mode}" transformation…`);

  let result;
  if (mode === 'hollow') {
    result = hollowOut(indices16, bedrockPalette, SX, SY, SZ, {
      fillBlock: config.fillBlock,
    });
  } else if (mode === 'lightpatch') {
    result = applyLightPatch(indices16, bedrockPalette, SX, SY, SZ, {
      lightBlock: config.lightBlock,
    });
  } else {
    result = invertStructure(indices16, bedrockPalette, SX, SY, SZ, {
      markerBlock: config.markerBlock,
    });
  }

  sendProgress(taskId, 0.75, 'Serialising result as JSON…');

  // Return transformed index array + palette as JSON (Bedrock NBT write in Phase 2-E)
  const json = JSON.stringify({
    dimensions,
    palette:  result.palette,
    indices:  Array.from(result.indices),
    stats:    result.stats,
  });
  const enc  = new TextEncoder().encode(json);
  const buf2 = enc.buffer.slice(enc.byteOffset, enc.byteOffset + enc.byteLength);

  // Map は structured clone で渡せるが JSON 展開時に {} になるため Object に変換
  const stats = { ...result.stats };
  if (stats.savedBlocks instanceof Map) stats.savedBlocks = Object.fromEntries(stats.savedBlocks);

  sendProgress(taskId, 0.99, 'Done.');
  sendComplete(taskId, buf2, { mode, dimensions, ...stats });
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
