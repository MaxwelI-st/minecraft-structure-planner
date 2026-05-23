/**
 * レッドストーンブロックの必須stateを監査・補完するモジュール。
 *
 * 設計原則:
 * - 未知のstateは黙って捨てない → 警告ログに記録
 * - フォールバック（air/stone化）はユーザー明示選択がない限り行わない
 * - 自動補完した場合は補完内容を必ずログに記録する
 */

/**
 * 各ブロックの必須stateと許容値の定義テーブル
 * required: 欠落チェックを行うstate名のリスト
 * defaults: 欠落時の自動補完値（undefined = 補完せず警告のみ）
 * validate: 値域チェック関数（省略可）
 */
const REDSTONE_STATE_SCHEMA = {
  'minecraft:repeater': {
    required: ['delay', 'facing', 'locked', 'powered'],
    defaults: { facing: 'north', locked: 'false', powered: 'false' },
    validate: {
      delay:   v => ['1', '2', '3', '4'].includes(v),
      facing:  v => ['north', 'south', 'east', 'west'].includes(v),
      locked:  v => ['true', 'false'].includes(v),
      powered: v => ['true', 'false'].includes(v),
    },
  },
  'minecraft:comparator': {
    required: ['facing', 'mode', 'powered'],
    defaults: { facing: 'north', mode: 'compare', powered: 'false' },
    validate: {
      facing:  v => ['north', 'south', 'east', 'west'].includes(v),
      mode:    v => ['compare', 'subtract'].includes(v),
      powered: v => ['true', 'false'].includes(v),
    },
  },
  'minecraft:observer': {
    required: ['facing', 'powered'],
    defaults: { facing: 'north', powered: 'false' },
    validate: {
      facing:  v => ['north', 'south', 'east', 'west', 'up', 'down'].includes(v),
      powered: v => ['true', 'false'].includes(v),
    },
  },
  'minecraft:piston': {
    required: ['extended', 'facing'],
    defaults: { extended: 'false', facing: 'north' },
    validate: {
      extended: v => ['true', 'false'].includes(v),
      facing:   v => ['north', 'south', 'east', 'west', 'up', 'down'].includes(v),
    },
  },
  'minecraft:sticky_piston': {
    required: ['extended', 'facing'],
    defaults: { extended: 'false', facing: 'north' },
    validate: {
      extended: v => ['true', 'false'].includes(v),
      facing:   v => ['north', 'south', 'east', 'west', 'up', 'down'].includes(v),
    },
  },
  'minecraft:piston_head': {
    required: ['facing', 'type', 'short'],
    defaults: { facing: 'north', type: 'normal', short: 'false' },
    validate: {
      facing: v => ['north', 'south', 'east', 'west', 'up', 'down'].includes(v),
      type:   v => ['normal', 'sticky'].includes(v),
      short:  v => ['true', 'false'].includes(v),
    },
  },
  'minecraft:redstone_wire': {
    required: ['power', 'north', 'south', 'east', 'west'],
    defaults: { power: '0', north: 'none', south: 'none', east: 'none', west: 'none' },
    validate: {
      power: v => { const n = Number(v); return Number.isInteger(n) && n >= 0 && n <= 15; },
      north: v => ['none', 'side', 'up'].includes(v),
      south: v => ['none', 'side', 'up'].includes(v),
      east:  v => ['none', 'side', 'up'].includes(v),
      west:  v => ['none', 'side', 'up'].includes(v),
    },
  },
  'minecraft:rail': {
    required: ['shape', 'waterlogged'],
    defaults: { shape: 'north_south', waterlogged: 'false' },
    validate: {
      shape: v => ['north_south', 'east_west', 'ascending_east', 'ascending_west',
                   'ascending_north', 'ascending_south', 'south_east', 'south_west',
                   'north_west', 'north_east'].includes(v),
    },
  },
  'minecraft:powered_rail': {
    required: ['shape', 'powered', 'waterlogged'],
    defaults: { shape: 'north_south', powered: 'false', waterlogged: 'false' },
    validate: {
      shape:   v => ['north_south', 'east_west', 'ascending_east', 'ascending_west',
                     'ascending_north', 'ascending_south'].includes(v),
      powered: v => ['true', 'false'].includes(v),
    },
  },
  'minecraft:detector_rail': {
    required: ['shape', 'powered', 'waterlogged'],
    defaults: { shape: 'north_south', powered: 'false', waterlogged: 'false' },
    validate: {
      shape: v => ['north_south', 'east_west', 'ascending_east', 'ascending_west',
                   'ascending_north', 'ascending_south'].includes(v),
    },
  },
  'minecraft:activator_rail': {
    required: ['shape', 'powered', 'waterlogged'],
    defaults: { shape: 'north_south', powered: 'false', waterlogged: 'false' },
    validate: {
      shape: v => ['north_south', 'east_west', 'ascending_east', 'ascending_west',
                   'ascending_north', 'ascending_south'].includes(v),
    },
  },
  'minecraft:tripwire_hook': {
    required: ['facing', 'attached', 'powered'],
    defaults: { facing: 'north', attached: 'false', powered: 'false' },
    validate: {
      facing:   v => ['north', 'south', 'east', 'west'].includes(v),
      attached: v => ['true', 'false'].includes(v),
      powered:  v => ['true', 'false'].includes(v),
    },
  },
  'minecraft:tripwire': {
    required: ['attached', 'disarmed', 'powered', 'north', 'south', 'east', 'west'],
    defaults: { attached: 'false', disarmed: 'false', powered: 'false',
                north: 'false', south: 'false', east: 'false', west: 'false' },
  },
  'minecraft:lever': {
    required: ['face', 'facing', 'powered'],
    defaults: { face: 'wall', facing: 'north', powered: 'false' },
    validate: {
      face:   v => ['floor', 'wall', 'ceiling'].includes(v),
      facing: v => ['north', 'south', 'east', 'west'].includes(v),
    },
  },
  'minecraft:hopper': {
    required: ['facing', 'enabled'],
    defaults: { facing: 'down', enabled: 'true' },
    validate: {
      facing: v => ['down', 'north', 'south', 'east', 'west'].includes(v),
    },
  },
  'minecraft:dropper': {
    required: ['facing', 'triggered'],
    defaults: { facing: 'north', triggered: 'false' },
    validate: {
      facing: v => ['north', 'south', 'east', 'west', 'up', 'down'].includes(v),
    },
  },
  'minecraft:dispenser': {
    required: ['facing', 'triggered'],
    defaults: { facing: 'north', triggered: 'false' },
    validate: {
      facing: v => ['north', 'south', 'east', 'west', 'up', 'down'].includes(v),
    },
  },
  'minecraft:redstone_lamp': {
    required: ['lit'],
    defaults: { lit: 'false' },
  },
  'minecraft:daylight_detector': {
    required: ['inverted', 'power'],
    defaults: { inverted: 'false', power: '0' },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// recomputeWireConnections (Phase 3 - 柱 6/7)
// ─────────────────────────────────────────────────────────────────────────────

import { computeWireConnections } from './redstone_wire_connect.js';

/**
 * Litematic 出力前に redstone_wire の n/s/e/w 接続フラグを再計算する。
 *
 * 仕組み:
 *   1. 各 wire 位置で隣接ブロックから接続パターンを computeWireConnections で算出
 *   2. 同じ接続パターンを持つ wire は同一 palette entry に統合
 *   3. javaIndices を新しい palette 配置に置き換える
 *
 * javaIndices は Bedrock ZYX 順 (idx = SZ*SY*x + SZ*y + z) 前提。
 * 呼び出し位置: process.worker.js の applyWaterlogging の直後、remapZYXtoYZX の前。
 *
 * @param {Uint16Array|Uint32Array} javaIndices - パレット index 配列 (ZYX)
 * @param {Array<{Name: string, Properties?: Object}>} javaPalette - 変換済み Java パレット
 * @param {number} SX
 * @param {number} SY
 * @param {number} SZ
 * @returns {{
 *   indices: Uint16Array|Uint32Array,
 *   palette: Array<{Name: string, Properties: Object}>,
 *   wireCount: number,
 *   newEntries: number,
 * }}
 */
export function recomputeWireConnections(javaIndices, javaPalette, SX, SY, SZ) {
  const wireIndices = new Set();
  for (let i = 0; i < javaPalette.length; i++) {
    if (javaPalette[i]?.Name === 'minecraft:redstone_wire') {
      wireIndices.add(i);
    }
  }
  if (wireIndices.size === 0) {
    return { indices: javaIndices, palette: javaPalette, wireCount: 0, newEntries: 0 };
  }

  const zyxIdx = (x, y, z) => SZ * SY * x + SZ * y + z;
  const palette = javaPalette.slice();
  const connToIdx = new Map();
  let newEntries = 0;
  let wireCount = 0;

  const getBlock = (x, y, z) => {
    if (x < 0 || x >= SX || y < 0 || y >= SY || z < 0 || z >= SZ) return null;
    const idx = javaIndices[zyxIdx(x, y, z)];
    const entry = palette[idx];
    if (!entry) return null;
    return { blockId: entry.Name, states: entry.Properties };
  };

  const outIndices = (javaIndices.constructor === Uint32Array)
    ? new Uint32Array(javaIndices)
    : new Uint16Array(javaIndices);

  for (let x = 0; x < SX; x++) {
    for (let y = 0; y < SY; y++) {
      for (let z = 0; z < SZ; z++) {
        const flat = zyxIdx(x, y, z);
        const palIdx = javaIndices[flat];
        if (!wireIndices.has(palIdx)) continue;

        wireCount++;
        const baseEntry = palette[palIdx];
        const baseProps = baseEntry.Properties || {};
        const conn = computeWireConnections({ x, y, z }, getBlock);
        const power = baseProps.power || '0';
        const connKey = `${power}|${conn.n}|${conn.s}|${conn.e}|${conn.w}`;

        let newIdx = connToIdx.get(connKey);
        if (newIdx === undefined) {
          const newEntry = {
            Name: 'minecraft:redstone_wire',
            Properties: {
              ...baseProps,
              power,
              north: conn.n,
              south: conn.s,
              east:  conn.e,
              west:  conn.w,
            },
          };
          newIdx = palette.length;
          palette.push(newEntry);
          connToIdx.set(connKey, newIdx);
          newEntries++;
        }
        outIndices[flat] = newIdx;
      }
    }
  }

  return { indices: outIndices, palette, wireCount, newEntries };
}

/**
 * パレットに対してRedstone stateを監査し、必要であれば補完する。
 *
 * @param {Array<{Name: string, Properties?: Object}>} palette
 * @returns {{ palette: Array, auditLog: Array<{block, state, issue, action}> }}
 */
export function auditRedstoneStates(palette) {
  const auditLog = [];

  const newPalette = palette.map(entry => {
    const schema = REDSTONE_STATE_SCHEMA[entry.Name];
    if (!schema) return entry; // スキーマ未定義のブロックは素通し

    const props = entry.Properties ? { ...entry.Properties } : {};
    let changed = false;

    for (const stateKey of schema.required) {
      const currentVal = props[stateKey];

      // M-B-07: 空文字列も欠落扱い (NBT パース時に空 string 化することがある)
      if (currentVal === undefined || currentVal === '') {
        const defaultVal = schema.defaults?.[stateKey];
        if (defaultVal !== undefined) {
          props[stateKey] = defaultVal;
          changed = true;
          auditLog.push({ block: entry.Name, state: stateKey, issue: currentVal === '' ? '空値' : '欠落', action: `補完: ${defaultVal}` });
        } else {
          auditLog.push({ block: entry.Name, state: stateKey, issue: '欠落（補完不可）', action: '警告のみ' });
        }
      } else if (schema.validate?.[stateKey]) {
        if (!schema.validate[stateKey](currentVal)) {
          const defaultVal = schema.defaults?.[stateKey];
          if (defaultVal !== undefined) {
            props[stateKey] = defaultVal;
            changed = true;
            auditLog.push({ block: entry.Name, state: stateKey, issue: `不正値: ${currentVal}`, action: `補完: ${defaultVal}` });
          } else {
            auditLog.push({ block: entry.Name, state: stateKey, issue: `不正値: ${currentVal}（補完不可）`, action: '警告のみ' });
          }
        }
      }
    }

    return changed ? { Name: entry.Name, Properties: props } : entry;
  });

  return { palette: newPalette, auditLog };
}
