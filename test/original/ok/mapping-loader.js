/**
 * mapping-loader.js — Block State Mapping Data Loader
 *
 * Fetches be_to_je_block_mapping.json and builds the Map<string, JavaBlockState>
 * used by BeToJeConverter for O(1) Bedrock→Java lookups.
 *
 * Key format (must match BeToJeConverter.buildKey):
 *   "minecraft:block_name|sortedKey1=val1,sortedKey2=val2"
 *
 * Sources for mapping data (02_TECHNICAL_REFERENCE §9-2):
 *   - GeyserMC/mappings (gold standard, auto-generated from Mojang data)
 *   - PrismarineJS/minecraft-data (Java-side BlockState enumeration)
 *
 * This module is importable in BOTH the main thread and Web Workers.
 * It has zero DOM dependencies.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Default path relative to the Vite dev server / production bundle root. */
const DEFAULT_MAPPING_URL = '/data/be_to_je_block_mapping.json';

/**
 * Air block — used as safe fallback for any mapping miss in critical paths.
 * Using stone (not air) so that missing blocks are visually obvious in-game.
 */
const FALLBACK_JAVA_BLOCK = Object.freeze({ Name: 'minecraft:stone', Properties: {} });

// ─────────────────────────────────────────────────────────────────────────────
// MappingLoader
// ─────────────────────────────────────────────────────────────────────────────

export class MappingLoader {
  /**
   * @param {string} [url] - Override the default mapping JSON URL.
   */
  constructor(url = DEFAULT_MAPPING_URL) {
    this._url    = url;
    /** @type {Map<string, { Name: string, Properties: object }> | null} */
    this._map    = null;
    this._loadPromise = null; // deduplicate concurrent load() calls
  }

  // ── Load ──────────────────────────────────────────────────────────────────

  /**
   * Fetch and parse the mapping JSON, building the lookup Map.
   * Idempotent: calling load() multiple times returns the same Promise.
   * The Map is cached for the lifetime of this loader instance.
   *
   * @param {Function} [onProgress] - (progress: 0–1, stage: string) => void
   * @returns {Promise<Map<string, { Name: string, Properties: object }>>}
   */
  load(onProgress = null) {
    if (this._map) return Promise.resolve(this._map);
    if (this._loadPromise) return this._loadPromise;

    this._loadPromise = this._doLoad(onProgress)
      .then(map => {
        this._map = map;
        this._loadPromise = null;
        return map;
      })
      .catch(err => {
        this._loadPromise = null;
        throw err;
      });

    return this._loadPromise;
  }

  async _doLoad(onProgress) {
    onProgress?.(0.05, 'Fetching block mapping JSON…');

    let json;
    try {
      const response = await fetch(this._url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText} — ${this._url}`);
      }
      onProgress?.(0.4, 'Parsing mapping JSON…');
      json = await response.json();
    } catch (err) {
      console.warn(
        `[MappingLoader] Could not load "${this._url}": ${err.message}\n` +
        'Block conversion will fall back to minecraft:stone for all unmapped blocks.\n' +
        'Generate be_to_je_block_mapping.json from GeyserMC/mappings-generator to fix this.'
      );
      // Return an empty Map — BeToJeConverter handles this gracefully
      return new Map();
    }

    onProgress?.(0.7, 'Building lookup Map…');
    const map = this._buildMap(json);

    onProgress?.(1.0, `Mapping ready (${map.size} entries)`);
    return map;
  }

  /**
   * Build the Map from the raw JSON object.
   * Validates and normalises entries while building.
   *
   * @param {object} json - Raw parsed JSON
   * @returns {Map<string, { Name: string, Properties: object }>}
   */
  _buildMap(json) {
    if (typeof json !== 'object' || Array.isArray(json)) {
      throw new TypeError('[MappingLoader] Mapping JSON must be a plain object (key → value).');
    }

    const map = new Map();
    let skipped = 0;

    for (const [key, value] of Object.entries(json)) {
      // Validate entry shape
      if (typeof value?.Name !== 'string') {
        skipped++;
        continue;
      }

      // Normalise Properties: ensure all values are strings (Java spec)
      const normalised = {
        Name: value.Name,
        Properties: {},
      };
      if (value.Properties && typeof value.Properties === 'object') {
        for (const [pk, pv] of Object.entries(value.Properties)) {
          normalised.Properties[pk] = String(pv);
        }
      }

      map.set(key, normalised);
    }

    if (skipped > 0) {
      console.warn(`[MappingLoader] Skipped ${skipped} malformed mapping entries.`);
    }

    return map;
  }

  // ── Lookup ────────────────────────────────────────────────────────────────

  /**
   * Look up a Java BlockState for a given Bedrock block (name + states).
   * Must call load() and await it before using this method.
   *
   * @param {string} name   - Bedrock block name, e.g. "minecraft:log"
   * @param {object} states - Bedrock states, e.g. { wood_type: "oak", pillar_axis: "y" }
   * @returns {{ Name: string, Properties: object }}
   */
  lookup(name, states = {}) {
    if (!this._map) {
      throw new Error('[MappingLoader] lookup() called before load() resolved.');
    }

    const key = MappingLoader.buildKey(name, states);
    return this._map.get(key) ?? FALLBACK_JAVA_BLOCK;
  }

  // ── Static helpers ────────────────────────────────────────────────────────

  /**
   * Build the canonical lookup key for a Bedrock block.
   * Mirrors BeToJeConverter.buildKey — must be kept in sync.
   *
   * @param {string} name
   * @param {object} states
   * @returns {string}
   */
  static buildKey(name, states = {}) {
    const stateKeys = Object.keys(states).sort();
    if (stateKeys.length === 0) return name;

    const stateStr = stateKeys
      .map(k => {
        const v = states[k];
        // Normalise boolean TAG_Byte (0/1) to '0'/'1' for canonical form
        const normalised = (v === 0 || v === false) ? '0'
                         : (v === 1 || v === true)  ? '1'
                         : String(v);
        return `${k}=${normalised}`;
      })
      .join(',');

    return `${name}|${stateStr}`;
  }

  /**
   * Generate a stub mapping JSON from an in-game block list.
   * Useful during development before the full GeyserMC mapping is available:
   * maps every Bedrock block to its same-name Java equivalent (works for ~60%
   * of blocks that share names between editions).
   *
   * @param {Array<{ name: string, states: object }>} bedrockPalette
   * @returns {object} Stub mapping JSON (write to be_to_je_block_mapping.json)
   */
  static generateStubMapping(bedrockPalette) {
    const stub = {};
    for (const { name, states } of bedrockPalette) {
      const key = MappingLoader.buildKey(name, states);
      if (!stub[key]) {
        // Naive stub: same name, convert boolean states to string
        const javaProps = {};
        for (const [k, v] of Object.entries(states)) {
          if (k === 'in_wall_bit') continue; // no Java equivalent
          if (typeof v === 'number' && (v === 0 || v === 1)) {
            javaProps[k] = v === 1 ? 'true' : 'false';
          } else {
            javaProps[k] = String(v);
          }
        }
        stub[key] = { Name: name, Properties: javaProps };
      }
    }
    return stub;
  }

  // ── Accessors ─────────────────────────────────────────────────────────────

  /** @returns {boolean} True if the mapping has been loaded. */
  get isLoaded() { return this._map !== null; }

  /** @returns {number} Number of entries in the loaded map (0 if not loaded). */
  get size() { return this._map?.size ?? 0; }

  /** @returns {Map | null} Direct access to the underlying Map (read-only use). */
  get map() { return this._map; }
}

// ─────────────────────────────────────────────────────────────────────────────
// Module-level singleton for use in Workers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shared singleton MappingLoader instance.
 * Workers import this and call `await defaultLoader.load()` once at startup.
 */
export const defaultLoader = new MappingLoader(DEFAULT_MAPPING_URL);
