/**
 * mapping.worker.js — Block State Mapping Worker
 *
 * Responsibilities:
 *   - Fetch be_to_je_block_mapping.json on LOAD_MAPPING task
 *   - Build Map<string, JavaBlockState> in memory
 *   - Serve O(1) lookups to process.worker.js via SharedArrayBuffer
 *     OR by keeping the Map resident here and routing lookup requests
 *     (Phase 2 will decide the exact IPC pattern)
 *
 * Phase 1: skeleton only — LOAD_MAPPING stub responds with COMPLETE.
 * Phase 2: full implementation in Milestone 2-A.
 */

// ── Resident mapping state (lives for the Worker's lifetime) ─────────────────
/** @type {Map<string, { Name: string, Properties: object }> | null} */
let _mappingMap = null;

// ── Helpers ───────────────────────────────────────────────────────────────────

function sendComplete(taskId, metadata = {}) {
  self.postMessage({ type: 'COMPLETE', taskId, payload: { metadata } });
}

function sendError(taskId, err) {
  const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  self.postMessage({ type: 'ERROR', taskId, payload: { error: message } });
}

function sendProgress(taskId, progress, stage = '') {
  self.postMessage({ type: 'PROGRESS', taskId, payload: { progress, stage } });
}

// ── Event loop ────────────────────────────────────────────────────────────────

self.onmessage = async ({ data }) => {
  const { type, taskId, payload } = data ?? {};
  if (!taskId) return;

  try {
    switch (type) {
      case 'LOAD_MAPPING':
        await handleLoadMapping(taskId, payload);
        break;

      case 'LOOKUP_BLOCK':
        handleLookupBlock(taskId, payload);
        break;

      default:
        sendError(taskId, `mapping.worker: unknown task type "${type}"`);
    }
  } catch (err) {
    sendError(taskId, err);
  }
};

// ── LOAD_MAPPING ──────────────────────────────────────────────────────────────

/**
 * Phase 2 full implementation will:
 *   1. fetch('/data/be_to_je_block_mapping.json')
 *   2. Build Map<"name|sortedStates", { Name, Properties }>
 *   3. Report COMPLETE with { size: mappingMap.size }
 *
 * Key format: "minecraft:log|pillar_axis=y,wood_type=oak"
 *   - Block name + "|" + all state key=value pairs sorted by key, joined by ","
 *   - This handles The Flattening divergence (02_TECHNICAL_REFERENCE §4-1)
 */
async function handleLoadMapping(taskId, payload) {
  sendProgress(taskId, 0.1, 'Fetching mapping data…');

  try {
    const response = await fetch('/data/be_to_je_block_mapping.json');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} fetching block mapping JSON`);
    }

    sendProgress(taskId, 0.5, 'Parsing mapping JSON…');
    const raw = await response.json();

    sendProgress(taskId, 0.8, 'Building lookup Map…');
    _mappingMap = new Map(Object.entries(raw));

    sendProgress(taskId, 1.0, 'Mapping ready.');
    sendComplete(taskId, { size: _mappingMap.size });

  } catch (err) {
    // Mapping file not yet created — warn but don't hard-fail startup.
    // Conversion will fail gracefully when the map is null.
    console.warn('mapping.worker: Could not load mapping JSON —', err.message);
    console.warn('Conversion will use stone as fallback for all unmapped blocks.');
    _mappingMap = new Map(); // empty map — lookups will fall back to minecraft:stone
    sendComplete(taskId, { size: 0, warning: err.message });
  }
}

// ── LOOKUP_BLOCK ──────────────────────────────────────────────────────────────

/**
 * Resolve a single Bedrock block to its Java equivalent.
 * Used by process.worker.js when it cannot import the mapping Map directly
 * (cross-worker imports require SharedArrayBuffer or message-passing).
 *
 * For high-throughput batch conversion, process.worker.js should request
 * the full mapping via a one-time EXPORT_MAP task (Phase 2 decision).
 *
 * @param {string} taskId
 * @param {{ name: string, states: object }} payload
 */
function handleLookupBlock(taskId, payload) {
  if (!_mappingMap) {
    sendError(taskId, 'Mapping not loaded. Send LOAD_MAPPING first.');
    return;
  }

  const { name, states = {} } = payload;
  const stateKey = Object.keys(states).sort()
    .map(k => `${k}=${states[k]}`).join(',');
  const key = stateKey ? `${name}|${stateKey}` : name;

  const javaBlock = _mappingMap.get(key)
    ?? { Name: 'minecraft:stone', Properties: {} }; // safe fallback

  sendComplete(taskId, { javaBlock });
}
