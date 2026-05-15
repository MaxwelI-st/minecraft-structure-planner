/**
 * main.js — Main Thread Entry Point
 *
 * Responsibilities (01_MASTER_DESIGN §2 — Main Thread scope):
 *   ✅ Worker lifecycle management (init, route, teardown)
 *   ✅ Promise-wrapped task dispatch (postTask)
 *   ✅ Progress event routing to UI components
 *   ✅ Error surface to UI
 *
 * STRICTLY FORBIDDEN in this file:
 *   ❌ NBT parsing or binary reading
 *   ❌ Block ID conversion or mapping lookups
 *   ❌ Litematic bit-packing
 *   ❌ Any ArrayBuffer manipulation beyond handing it to a Worker
 *
 * All heavy work is delegated to:
 *   → js/workers/process.worker.js  (parse, convert, scaffold, invert)
 *   → js/workers/mapping.worker.js  (block state mapping lookup)
 */

import { ToastManager }    from './ui/components/toast.js';
import { ProgressManager } from './ui/components/progress.js';

// ─────────────────────────────────────────────────────────────────────────────
// Worker Manager
// ─────────────────────────────────────────────────────────────────────────────

/**
 * WorkerManager wraps a Web Worker with:
 *   - A Map of pending Promises keyed by taskId
 *   - Progress event forwarding to registered handlers
 *   - Automatic error routing back to the originating Promise
 */
class WorkerManager {
  /**
   * @param {URL|string} workerUrl         - Worker module URL (use `new URL(...)`)
   * @param {object}     [options]
   * @param {string}     [options.name]    - Worker name for DevTools identification
   */
  constructor(workerUrl, { name = 'worker' } = {}) {
    this._name    = name;
    this._pending = new Map(); // taskId → { resolve, reject, onProgress }

    this._worker = new Worker(workerUrl, { type: 'module', name });

    this._worker.onmessage = (event) => this._handleMessage(event);

    this._worker.onerror = (errorEvent) => {
      // Uncaught Worker exception — no taskId available.
      // Log and reject ALL pending tasks so nothing hangs forever.
      console.error(`[${this._name}] Uncaught Worker error:`, errorEvent);
      const msg = `Uncaught Worker error: ${errorEvent.message}`;
      for (const [id, { reject }] of this._pending) {
        reject(new Error(msg));
      }
      this._pending.clear();
    };
  }

  // ── Internal message router ───────────────────────────────────────────────

  _handleMessage({ data }) {
    const { type, taskId, payload } = data ?? {};

    if (!taskId) {
      console.warn(`[${this._name}] Message without taskId:`, data);
      return;
    }

    const pending = this._pending.get(taskId);
    if (!pending) {
      console.warn(`[${this._name}] No pending task for taskId "${taskId}" — ignoring.`);
      return;
    }

    switch (type) {
      case 'PROGRESS':
        pending.onProgress?.(payload.progress, payload.stage);
        break;

      case 'COMPLETE':
        this._pending.delete(taskId);
        pending.resolve(payload);
        break;

      case 'ERROR':
        this._pending.delete(taskId);
        pending.reject(new Error(payload.error ?? 'Worker task failed'));
        break;

      default:
        console.warn(`[${this._name}] Unknown response type "${type}" for task "${taskId}".`);
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Post a task to the Worker and return a Promise that resolves with the
   * COMPLETE payload or rejects with the ERROR message.
   *
   * Transferable buffers in `transferList` are zero-copied to the Worker.
   * ⚠️ After calling postTask with a buffer in transferList, the buffer in
   *    the main thread becomes detached (byteLength === 0). Do not read it.
   *
   * @param {string}        type          - WorkerTask.type
   * @param {object}        payload       - WorkerTask.payload
   * @param {Transferable[]} [transferList=[]] - Buffers to transfer (zero-copy)
   * @param {Function}      [onProgress]  - (progress: 0–1, stage: string) => void
   * @returns {Promise<object>}           - Resolves with WorkerResponse.payload
   */
  postTask(type, payload, transferList = [], onProgress = null) {
    const taskId = _generateTaskId();

    return new Promise((resolve, reject) => {
      this._pending.set(taskId, { resolve, reject, onProgress });

      this._worker.postMessage(
        { type, taskId, payload },
        transferList,
      );
    });
  }

  /**
   * Terminate the Worker immediately.
   * All pending Promises are rejected.
   */
  terminate() {
    this._worker.terminate();
    for (const [, { reject }] of this._pending) {
      reject(new Error(`[${this._name}] Worker terminated`));
    }
    this._pending.clear();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Application bootstrap
// ─────────────────────────────────────────────────────────────────────────────

// UI helper singletons (thin wrappers over DOM — defined in their own modules)
const toast    = new ToastManager();
const progress = new ProgressManager();

// Worker instances — created once at startup, reused for the app's lifetime
const processWorker = new WorkerManager(
  new URL('./workers/process.worker.js', import.meta.url),
  { name: 'process-worker' },
);

const mappingWorker = new WorkerManager(
  new URL('./workers/mapping.worker.js', import.meta.url),
  { name: 'mapping-worker' },
);

// ── Initialise mapping data on startup ───────────────────────────────────────
let mappingReady = false;

(async () => {
  try {
    await mappingWorker.postTask('LOAD_MAPPING', {});
    mappingReady = true;
    console.log('[main] Block mapping data loaded.');
  } catch (err) {
    console.error('[main] Failed to load mapping data:', err);
    toast.error('ブロックマッピングの読み込みに失敗しました。変換機能が使用できません。');
  }
})();

// ─────────────────────────────────────────────────────────────────────────────
// Public API — called by UI panel modules
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse a .mcstructure file.
 * Returns metadata (dimensions, palette, blockCount) without loading the
 * full block array into memory.
 *
 * @param {File|ArrayBuffer} source
 * @returns {Promise<{ dimensions, worldOrigin, paletteSize, blockCount, palette }>}
 */
export async function parseStructure(source) {
  const buffer = source instanceof File ? await source.arrayBuffer() : source;

  progress.show('Parsing structure…', 0);

  try {
    const result = await processWorker.postTask(
      'PARSE_NBT',
      {
        buffer,
        config: { sourceFormat: 'mcstructure' },
      },
      [buffer], // Transfer — buffer is detached in main after this line
      (p, stage) => progress.update(stage, p),
    );

    progress.hide();
    return result.metadata;

  } catch (err) {
    progress.hide();
    toast.error(`パースエラー: ${err.message}`);
    throw err;
  }
}

/**
 * Convert a parsed .mcstructure to a Java .litematic file.
 * Returns the GZip-compressed Litematic ArrayBuffer ready for download.
 *
 * ⚠️ Mapping data must be loaded before calling this (mappingReady === true).
 *
 * @param {ArrayBuffer} mcstructureBuffer
 * @param {object}      config
 * @param {number}      [config.minecraftDataVersion=3700] - Target MC data version
 * @returns {Promise<ArrayBuffer>}
 */
export async function convertToLitematic(mcstructureBuffer, config = {}) {
  if (!mappingReady) {
    throw new Error('Block mapping data is not yet loaded. Please wait and try again.');
  }

  progress.show('Converting to Litematic…', 0);

  try {
    const result = await processWorker.postTask(
      'CONVERT_LITEMATIC',
      {
        buffer: mcstructureBuffer,
        config: {
          sourceFormat: 'mcstructure',
          targetFormat: 'litematic',
          minecraftDataVersion: config.minecraftDataVersion ?? 3700,
        },
      },
      [mcstructureBuffer],
      (p, stage) => progress.update(stage, p),
    );

    progress.hide();

    if (result.metadata?.warnings?.length > 0) {
      toast.warn(
        `変換完了（警告 ${result.metadata.warnings.length} 件）: ` +
        result.metadata.warnings.slice(0, 3).join(' / '),
      );
    } else {
      toast.success('Litematic変換完了！');
    }

    return result.data; // ArrayBuffer (transferred from Worker)

  } catch (err) {
    progress.hide();
    toast.error(`変換エラー: ${err.message}`);
    throw err;
  }
}

/**
 * Trigger a browser download of an ArrayBuffer as a named file.
 * Validates that the filename contains no spaces (OderSo addon constraint).
 *
 * @param {ArrayBuffer} buffer
 * @param {string}      filename
 */
export function downloadBuffer(buffer, filename) {
  // OderSo / Schematica silently skips files with spaces in the name.
  const safeName = filename.replace(/\s+/g, '_');
  if (safeName !== filename) {
    console.warn(`[main] Filename contained spaces — sanitised to "${safeName}".`);
  }

  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = safeName;
  a.click();

  // Revoke after a tick to allow the download to start
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Generate scaffolding placement data for a parsed structure.
 *
 * @param {{ blockCount, dimensions, palette }} metadata - From parseStructure()
 * @returns {Promise<{ scaffoldBlocks: Array, buildSequence: Array }>}
 */
export async function generateScaffolding(metadata) {
  progress.show('足場を計算中…', 0);
  try {
    const result = await processWorker.postTask(
      'SCAFFOLD_GEN',
      { config: metadata },
      [],
      (p, stage) => progress.update(stage, p),
    );
    progress.hide();
    return result.data;
  } catch (err) {
    progress.hide();
    toast.error(`足場生成エラー: ${err.message}`);
    throw err;
  }
}

/**
 * Generate an inversion (excavation guide) for a parsed structure.
 *
 * @param {ArrayBuffer} mcstructureBuffer
 * @returns {Promise<ArrayBuffer>} - New .mcstructure with solid/air swapped
 */
export async function generateInversion(mcstructureBuffer) {
  progress.show('掘削ガイドを生成中…', 0);
  try {
    const result = await processWorker.postTask(
      'INVERT_GEN',
      { buffer: mcstructureBuffer },
      [mcstructureBuffer],
      (p, stage) => progress.update(stage, p),
    );
    progress.hide();
    return result.data;
  } catch (err) {
    progress.hide();
    toast.error(`反転生成エラー: ${err.message}`);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a collision-resistant unique ID for task routing.
 * Uses crypto.randomUUID() if available (all modern browsers), with a
 * Math.random() fallback for environments where it is not.
 *
 * @returns {string}
 */
function _generateTaskId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback: timestamp + random hex
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// DOM bootstrap — wire up file input once DOM is ready
// ─────────────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('mcstructure-input');
  if (!fileInput) {
    console.warn('[main] #mcstructure-input not found — file input not wired.');
    return;
  }

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const metadata = await parseStructure(file);
      console.log('[main] Structure parsed:', metadata);
      // Viewer panel will subscribe to a custom event or be called directly.
      document.dispatchEvent(
        new CustomEvent('structure:loaded', { detail: metadata }),
      );
    } catch {
      // Error already surfaced via toast in parseStructure()
    }
  });

  const convertBtn = document.getElementById('convert-litematic-btn');
  if (convertBtn) {
    convertBtn.addEventListener('click', async () => {
      // The viewer panel is expected to expose the last-loaded buffer via a
      // module-level reference. This wiring will be completed in Phase 1-C.
      toast.info('Litematic変換はPhase 2で実装予定です。');
    });
  }
});
