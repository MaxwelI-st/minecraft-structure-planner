/**
 * be-to-je.js — Bedrock → Java Block State Converter
 *
 * Design (02_TECHNICAL_REFERENCE §4):
 *   - Data-driven: never hardcodes ID translation logic.
 *   - Key format: "blockName|sortedKey1=val1,sortedKey2=val2"
 *   - Waterlogging: Bedrock layer 1 ≠ -1 → Java waterlogged:"true"
 *   - Boolean coercion: Bedrock TAG_Byte (0/1) → Java String "false"/"true"
 *   - Known landmines handled explicitly (see SPECIAL_CASES below).
 *   - All unmapped blocks fall back to minecraft:stone with a warning.
 *
 * Worker usage:
 *   import { BeToJeConverter } from '../modules/mapping/be-to-je.js';
 *   const converter = new BeToJeConverter(mappingMap); // Map from mapping.worker.js
 *   const { javaBlock, warnings } = converter.convertPalette(bedrockPalette, layer1Indices);
 */

// ─────────────────────────────────────────────────────────────────────────────
// Known landmines — blocks requiring special handling beyond a simple Map lookup
// (02_TECHNICAL_REFERENCE §4-3)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Post-processing hooks applied AFTER the main mapping lookup.
 * Each entry: { match: fn(name, states) → bool, transform: fn(javaBlock, beStates) → javaBlock }
 * Applied in order; first match wins.
 */
const SPECIAL_CASES = [

  // minecraft:fence_gate — strip `in_wall_bit` (no Java equivalent)
  {
    match: (name) => name.endsWith(':fence_gate'),
    transform: (jb) => {
      const p = { ...jb.Properties };
      delete p.in_wall;   // Java computes this dynamically
      delete p.in_wall_bit;
      return { ...jb, Properties: p };
    },
  },

  // minecraft:coral_* — dead_bit=1b → prefix name with "dead_"
  {
    match: (name) => name.includes(':coral') && !name.includes('dead'),
    transform: (jb, beStates) => {
      if (beStates.dead_bit === 1 || beStates.dead_bit === true) {
        const deadName = jb.Name.replace('minecraft:', 'minecraft:dead_');
        return { ...jb, Name: deadName };
      }
      return jb;
    },
  },

  // minecraft:leaves / leaves2 — ensure `persistent` and `distance` are set
  {
    match: (name) => name === 'minecraft:leaves' || name === 'minecraft:leaves2',
    transform: (jb, beStates) => {
      const persistent = (beStates.persistent_bit === 1 || beStates.persistent_bit === true)
        ? 'true' : 'false';
      return {
        ...jb,
        Properties: { ...jb.Properties, persistent, distance: '1' },
      };
    },
  },

  // minecraft:double_stone_slab / double_stone_slab2 — type=double
  {
    match: (name) => name.startsWith('minecraft:double_') && name.includes('slab'),
    transform: (jb) => ({
      ...jb,
      Properties: { ...jb.Properties, type: 'double' },
    }),
  },

  // minecraft:trapdoor — open_bit: Bedrock 0=closed, Java open=false (inversion guard)
  {
    match: (name) => name.endsWith(':trapdoor'),
    transform: (jb, beStates) => {
      // Mapping JSON should handle this, but double-check the open state is not inverted
      const openBit = beStates.open_bit;
      if (openBit !== undefined) {
        const open = (openBit === 1 || openBit === true) ? 'true' : 'false';
        return { ...jb, Properties: { ...jb.Properties, open } };
      }
      return jb;
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// BeToJeConverter
// ─────────────────────────────────────────────────────────────────────────────

export class BeToJeConverter {
  /**
   * @param {Map<string, { Name: string, Properties: object }>} mappingMap
   *   Built by mapping.worker.js from be_to_je_block_mapping.json.
   *   Key format: "minecraft:block_name|sortedState1=val1,sortedState2=val2"
   */
  constructor(mappingMap) {
    if (!(mappingMap instanceof Map)) {
      throw new TypeError('BeToJeConverter: mappingMap must be a Map instance');
    }
    this._map = mappingMap;
    this._warnings = [];
  }

  // ── Key builder ───────────────────────────────────────────────────────────

  /**
   * Build the lookup key for a Bedrock block.
   * States are sorted by key name to guarantee a canonical form regardless
   * of NBT tag order in the source file.
   *
   * @param {string} name   - Bedrock block name, e.g. "minecraft:log"
   * @param {object} states - Bedrock states, e.g. { wood_type: "oak", pillar_axis: "y" }
   * @returns {string}
   */
  static buildKey(name, states = {}) {
    const stateKeys = Object.keys(states).sort();
    if (stateKeys.length === 0) return name;

    const stateStr = stateKeys
      .map(k => {
        const v = states[k];
        // Normalise Bedrock boolean TAG_Byte (0/1) to string for canonical key
        const normalised = (v === 0 || v === false) ? '0'
                         : (v === 1 || v === true)  ? '1'
                         : String(v);
        return `${k}=${normalised}`;
      })
      .join(',');

    return `${name}|${stateStr}`;
  }

  // ── Single block lookup ───────────────────────────────────────────────────

  /**
   * Convert one Bedrock block entry to a Java BlockState.
   *
   * @param {string} name   - Bedrock block name
   * @param {object} states - Bedrock states object
   * @param {boolean} [waterlogged=false] - True if Bedrock layer 1 ≠ -1 at this position
   * @returns {{ Name: string, Properties: object }}
   */
  convertBlock(name, states = {}, waterlogged = false) {
    const key = BeToJeConverter.buildKey(name, states);
    let javaBlock = this._map.get(key);

    // Fallback: try lookup without states (for blocks that have no relevant states)
    if (!javaBlock && Object.keys(states).length > 0) {
      javaBlock = this._map.get(name);
    }

    if (!javaBlock) {
      this._warnings.push(`Unmapped: ${key}`);
      javaBlock = { Name: 'minecraft:stone', Properties: {} };
    } else {
      // Deep-clone to avoid mutating the shared mapping Map
      javaBlock = { Name: javaBlock.Name, Properties: { ...javaBlock.Properties } };
    }

    // ── Apply special-case post-processing ────────────────────────────────
    for (const sc of SPECIAL_CASES) {
      if (sc.match(name, states)) {
        javaBlock = sc.transform(javaBlock, states);
        break;
      }
    }

    // ── Waterlogging (02_TECHNICAL_REFERENCE §2-3) ───────────────────────
    // Bedrock layer 1 ≠ -1 → Java waterlogged:"true"
    // Only apply to blocks that support waterlogging (not air, not liquid itself)
    if (waterlogged && javaBlock.Name !== 'minecraft:air') {
      javaBlock.Properties.waterlogged = 'true';
    }

    // ── Boolean normalisation ─────────────────────────────────────────────
    // Bedrock states may have been stored as TAG_Byte (0/1).
    // Java Properties are always strings. Ensure all values are strings.
    for (const [k, v] of Object.entries(javaBlock.Properties)) {
      if (typeof v !== 'string') {
        javaBlock.Properties[k] = String(v);
      }
    }

    return javaBlock;
  }

  // ── Palette conversion ────────────────────────────────────────────────────

  /**
   * Convert an entire Bedrock block palette to Java BlockStates.
   * Also builds the reverse index (Java palette deduplication).
   *
   * @param {Array<{ name: string, states: object }>} bedrockPalette
   *   Array of Bedrock palette entries (from nbt-reader.js palette parse).
   * @param {Int32Array|null} layer1Indices
   *   Flat array of layer-1 indices (ZYX order, -1 = no liquid).
   *   Pass null if waterlogging detection is not needed.
   * @param {number} totalBlocks - SX * SY * SZ (used to validate layer1 length)
   *
   * @returns {{
   *   javaPalette: Array<{ Name: string, Properties: object }>,
   *   beToJeIndexMap: Uint16Array,  -- maps Bedrock palette index → Java palette index
   *   warnings: string[]
   * }}
   */
  convertPalette(bedrockPalette, layer1Indices = null, totalBlocks = 0) {
    this._warnings = [];

    // ── Step 1: Convert each Bedrock palette entry ─────────────────────────
    // We first convert without waterlogging (palette-level conversion).
    // Waterlogging is position-dependent (requires layer1Indices) and handled
    // during per-block remapping in step 3 if layer1Indices is provided.
    const converted = bedrockPalette.map(({ name, states }) =>
      this.convertBlock(name, states, false)
    );

    // ── Step 2: Build deduplicated Java palette ────────────────────────────
    // Multiple Bedrock palette entries may map to the same Java block.
    // Use a canonical string key for deduplication.
    const javaKeyToIndex = new Map();
    const javaPalette    = [];

    const beToJeIndexMap = new Uint16Array(bedrockPalette.length);

    for (let i = 0; i < converted.length; i++) {
      const jb  = converted[i];
      const key = _canonicalJavaKey(jb);

      if (javaKeyToIndex.has(key)) {
        beToJeIndexMap[i] = javaKeyToIndex.get(key);
      } else {
        const newIdx = javaPalette.length;
        javaKeyToIndex.set(key, newIdx);
        javaPalette.push(jb);
        beToJeIndexMap[i] = newIdx;
      }
    }

    return {
      javaPalette,
      beToJeIndexMap,
      warnings: [...this._warnings],
    };
  }

  /**
   * Apply waterlogging from layer1 indices after palette conversion.
   * Returns a modified javaPalette and an updated beToJeIndexMap that
   * accounts for waterlogged variants as distinct palette entries.
   *
   * Called by process.worker.js after convertPalette() for structures
   * that have non-trivial layer1 data.
   *
   * @param {Int32Array}   layer0Indices  - Bedrock layer 0 flat indices (ZYX)
   * @param {Int32Array}   layer1Indices  - Bedrock layer 1 flat indices (ZYX), -1=none
   * @param {Uint16Array}  beToJeIndexMap - From convertPalette()
   * @param {Array}        javaPalette    - From convertPalette() (will be mutated/extended)
   * @returns {Uint16Array} New flat index array with waterlogged variants
   */
  applyWaterlogging(layer0Indices, layer1Indices, beToJeIndexMap, javaPalette) {
    const total = layer0Indices.length;
    const outIndices = new Uint16Array(total);

    // Build a cache: jePaletteIdx → waterloggedVariantIdx
    const waterlogCache = new Map();

    for (let i = 0; i < total; i++) {
      const be0 = layer0Indices[i];
      const be1 = layer1Indices[i];

      const jeIdx = beToJeIndexMap[be0 < 0 ? 0 : be0];

      if (be1 !== -1) {
        // This position is waterlogged — ensure a waterlogged variant exists
        if (!waterlogCache.has(jeIdx)) {
          const base = javaPalette[jeIdx];
          if (base.Name !== 'minecraft:air') {
            const wlogVariant = {
              Name: base.Name,
              Properties: { ...base.Properties, waterlogged: 'true' },
            };
            const wlogIdx = javaPalette.length;
            javaPalette.push(wlogVariant);
            waterlogCache.set(jeIdx, wlogIdx);
          } else {
            waterlogCache.set(jeIdx, jeIdx); // air stays air
          }
        }
        outIndices[i] = waterlogCache.get(jeIdx);
      } else {
        outIndices[i] = jeIdx;
      }
    }

    return outIndices;
  }

  /** Return accumulated warnings since last convertPalette() call. */
  get warnings() {
    return this._warnings;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a canonical string key for a Java BlockState for deduplication.
 * Sorts Properties keys for stability.
 *
 * @param {{ Name: string, Properties: object }} jb
 * @returns {string}
 */
function _canonicalJavaKey(jb) {
  const props = Object.keys(jb.Properties).sort()
    .map(k => `${k}=${jb.Properties[k]}`)
    .join(',');
  return props ? `${jb.Name}[${props}]` : jb.Name;
}
