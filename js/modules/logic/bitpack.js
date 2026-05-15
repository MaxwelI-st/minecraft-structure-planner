/**
 * bitpack.js — Litematic BlockState Bit-Packing
 *
 * 1.16+ no-wrap ルール厳守:
 *   entriesPerLong = Math.floor(64 / bitsPerEntry)   ← FLOOR のみ (ceil → 砂嵐バグ)
 *
 * Long 演算はすべて BigInt で行い 53bit 精度欠損を回避。
 */

const MIN_BITS = 4;

function bitsFor(paletteSize) {
  return Math.max(MIN_BITS, Math.ceil(Math.log2(Math.max(paletteSize, 2))));
}

/**
 * Block state indices → Litematic LongArray (BigInt64Array).
 * @param {Uint16Array} indices   YZX順インデックス配列
 * @param {number}      paletteSize
 * @returns {BigInt64Array}
 */
export function packBlockStates(indices, paletteSize) {
  const bpe  = bitsFor(paletteSize);
  const epl  = Math.floor(64 / bpe);          // entries per long
  const mask = (1n << BigInt(bpe)) - 1n;
  const longCount = Math.ceil(indices.length / epl);
  const longs = new BigInt64Array(longCount);

  for (let i = 0; i < indices.length; i++) {
    const li  = Math.floor(i / epl);
    const off = (i % epl) * bpe;
    longs[li] |= (BigInt(indices[i]) & mask) << BigInt(off);
  }
  return longs;
}

/**
 * Litematic LongArray → block state indices。
 * @param {BigInt64Array} longs
 * @param {number}        total       総ブロック数
 * @param {number}        paletteSize
 * @returns {Uint16Array}
 */
export function unpackBlockStates(longs, total, paletteSize) {
  const bpe  = bitsFor(paletteSize);
  const epl  = Math.floor(64 / bpe);
  const mask = (1n << BigInt(bpe)) - 1n;
  const out  = new Uint16Array(total);

  for (let i = 0; i < total; i++) {
    const li  = Math.floor(i / epl);
    const off = (i % epl) * bpe;
    out[i] = Number((BigInt.asUintN(64, longs[li]) >> BigInt(off)) & mask);
  }
  return out;
}

/**
 * Bedrock ZYX順 → Litematic YZX順 へインデックスを並び替え。
 *
 * Bedrock:  idx = SZ*SY*x + SZ*y + z
 * Litematic: idx = y*SZ*SX + z*SX + x
 *
 * @param {Uint16Array|Int32Array} indices  Bedrock ZYX順
 * @param {number} SX
 * @param {number} SY
 * @param {number} SZ
 * @returns {Uint16Array}
 */
export function remapZYXtoYZX(indices, SX, SY, SZ) {
  const out = new Uint16Array(SX * SY * SZ);
  for (let x = 0; x < SX; x++) {
    for (let y = 0; y < SY; y++) {
      for (let z = 0; z < SZ; z++) {
        const beIdx = SZ * SY * x + SZ * y + z;
        const jeIdx = y * SZ * SX + z * SX + x;
        const v = indices[beIdx];
        out[jeIdx] = v < 0 ? 0 : v;
      }
    }
  }
  return out;
}
