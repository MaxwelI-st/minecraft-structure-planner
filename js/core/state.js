/**
 * state.js — Global Application State Store
 *
 * Reactive key-value store for main-thread app state.
 * Workers do NOT import this — they communicate via WorkerManager messages.
 *
 * Pattern: subscribe to specific keys, receive old+new values on change.
 * DOM-safe only (main thread). Zero Worker dependency.
 */

import { EventEmitter } from './events.js';

// ─────────────────────────────────────────────────────────────────────────────
// AppState
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {object} StructureMetadata
 * @property {[number,number,number]} dimensions
 * @property {[number,number,number]} worldOrigin
 * @property {number}  paletteSize
 * @property {number}  blockCount
 * @property {Array}   palette
 * @property {string}  fileName
 */

class AppState extends EventEmitter {
  constructor() {
    super();

    /** @type {Record<string, any>} */
    this._state = {
      // ── Loaded structure ──────────────────────────────────────────────────
      /** @type {StructureMetadata | null} */
      currentStructure: null,

      /** @type {File | null} — held for re-read after Worker transfer */
      currentFile: null,

      // ── Mapping ───────────────────────────────────────────────────────────
      mappingReady: false,
      mappingSize:  0,        // number of entries in the loaded Map

      // ── Conversion ───────────────────────────────────────────────────────
      converting: false,
      lastWarnings: [],       // string[] from most recent conversion

      // ── UI ────────────────────────────────────────────────────────────────
      activeTab:    'materials',
      viewer3dOpen: false,
    };
  }

  // ── Read ──────────────────────────────────────────────────────────────────

  /** @param {string} key @returns {any} */
  get(key) {
    return this._state[key];
  }

  /** Snapshot of the entire state (shallow copy). */
  snapshot() {
    return { ...this._state };
  }

  // ── Write ─────────────────────────────────────────────────────────────────

  /**
   * Update one or more state keys.
   * Fires `change:<key>` and `change` events for each changed key.
   *
   * @param {Partial<typeof this._state>} patch
   */
  set(patch) {
    for (const [key, next] of Object.entries(patch)) {
      const prev = this._state[key];
      if (prev === next) continue;
      this._state[key] = next;
      this.emit(`change:${key}`, { key, prev, next });
      this.emit('change', { key, prev, next });
    }
  }

  // ── Subscribe helpers ──────────────────────────────────────────────────────

  /**
   * Subscribe to changes of a specific key.
   * Callback receives `{ key, prev, next }`.
   *
   * @param {string}   key
   * @param {Function} fn
   * @returns {Function} Unsubscribe function
   */
  watch(key, fn) {
    this.on(`change:${key}`, fn);
    return () => this.off(`change:${key}`, fn);
  }

  /**
   * Subscribe to any state change.
   * @param {Function} fn
   * @returns {Function} Unsubscribe function
   */
  watchAll(fn) {
    this.on('change', fn);
    return () => this.off('change', fn);
  }
}

/** Singleton — import and use directly. */
export const appState = new AppState();
