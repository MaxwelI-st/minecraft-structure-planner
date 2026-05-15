/**
 * events.js — Lightweight EventEmitter
 *
 * Used by:
 *   - process.worker.js internal event bus (section:ready, palette:built)
 *   - main.js application-level event bus (structure:loaded, project:changed)
 *
 * Zero DOM / Node.js dependencies — safe in Web Workers.
 */

export class EventEmitter {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this._listeners = new Map();
  }

  /**
   * Register a listener for an event.
   * @param {string}   event
   * @param {Function} fn
   * @returns {this}
   */
  on(event, fn) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(fn);
    return this;
  }

  /**
   * Register a one-shot listener that removes itself after first call.
   * @param {string}   event
   * @param {Function} fn
   * @returns {this}
   */
  once(event, fn) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      fn(...args);
    };
    wrapper._origin = fn; // lets off() remove by original reference
    return this.on(event, wrapper);
  }

  /**
   * Remove a listener.
   * @param {string}   event
   * @param {Function} fn
   * @returns {this}
   */
  off(event, fn) {
    const set = this._listeners.get(event);
    if (!set) return this;
    for (const listener of set) {
      if (listener === fn || listener._origin === fn) {
        set.delete(listener);
        break;
      }
    }
    if (set.size === 0) this._listeners.delete(event);
    return this;
  }

  /**
   * Emit an event, calling all registered listeners synchronously.
   * @param {string} event
   * @param {...*}   args
   * @returns {boolean} True if any listeners were called.
   */
  emit(event, ...args) {
    const set = this._listeners.get(event);
    if (!set || set.size === 0) return false;
    for (const fn of set) {
      try { fn(...args); }
      catch (err) { console.error(`[EventEmitter] Uncaught error in "${event}" listener:`, err); }
    }
    return true;
  }

  /**
   * Remove all listeners for a specific event, or all events if omitted.
   * @param {string} [event]
   */
  clear(event) {
    if (event) this._listeners.delete(event);
    else       this._listeners.clear();
  }

  /**
   * Returns a Promise that resolves with the next emission of `event`.
   * Optionally times out after `timeoutMs` ms (rejects with TimeoutError).
   *
   * @param {string} event
   * @param {number} [timeoutMs=0] - 0 = no timeout
   * @returns {Promise<any>}
   */
  waitFor(event, timeoutMs = 0) {
    return new Promise((resolve, reject) => {
      let timer;
      const handler = (data) => {
        if (timer) clearTimeout(timer);
        resolve(data);
      };
      this.once(event, handler);
      if (timeoutMs > 0) {
        timer = setTimeout(() => {
          this.off(event, handler);
          reject(new Error(`[EventEmitter] Timed out waiting for "${event}" after ${timeoutMs}ms`));
        }, timeoutMs);
      }
    });
  }
}

/** Module-level singleton for the main-thread application bus. */
export const appBus = new EventEmitter();
