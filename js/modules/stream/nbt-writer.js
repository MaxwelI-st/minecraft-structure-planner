/**
 * nbt-writer.js — Java Edition NBT シリアライザ（Big-Endian）
 *
 * 対応タグ: TAG_End/Byte/Short/Int/Long/Float/Double/
 *           ByteArray/String/List/Compound/IntArray/LongArray
 * Long値は BigInt で処理（53bit 精度問題を回避）。
 * DOM / Node.js 依存なし。GZip 圧縮は呼び出し側で実施。
 */

// ── タグ型定数 ────────────────────────────────────────────────────────────────
const T = {
  END: 0, BYTE: 1, SHORT: 2, INT: 3, LONG: 4,
  FLOAT: 5, DOUBLE: 6, BYTE_ARRAY: 7, STRING: 8,
  LIST: 9, COMPOUND: 10, INT_ARRAY: 11, LONG_ARRAY: 12,
};

// ── 動的バッファ ──────────────────────────────────────────────────────────────
const _ENC = new TextEncoder();

class Buf {
  constructor() {
    this._a = new Uint8Array(1 << 16);
    this._v = new DataView(this._a.buffer);
    this._p = 0;
  }
  _grow(n) {
    if (this._p + n <= this._a.length) return;
    let len = this._a.length;
    while (len < this._p + n) len *= 2;
    const b = new Uint8Array(len);
    b.set(this._a);
    this._a = b; this._v = new DataView(b.buffer);
  }
  u8(v)  { this._grow(1); this._v.setUint8(this._p++, v); }
  i8(v)  { this._grow(1); this._v.setInt8(this._p++, v); }
  i16(v) { this._grow(2); this._v.setInt16(this._p, v, false); this._p += 2; }
  i32(v) { this._grow(4); this._v.setInt32(this._p, v, false); this._p += 4; }
  f32(v) { this._grow(4); this._v.setFloat32(this._p, v, false); this._p += 4; }
  f64(v) { this._grow(8); this._v.setFloat64(this._p, v, false); this._p += 8; }
  i64(v) {
    this._grow(8);
    const b = typeof v === 'bigint' ? v : BigInt(v);
    const hi = Number(BigInt.asIntN(64, b) >> 32n);
    const lo = Number(BigInt.asIntN(64, b) & 0xFFFFFFFFn);
    this._v.setInt32(this._p,     hi, false);
    this._v.setInt32(this._p + 4, lo, false);
    this._p += 8;
  }
  str(s) {
    const b = _ENC.encode(s);
    this.i16(b.length);
    this._grow(b.length);
    this._a.set(b, this._p);
    this._p += b.length;
  }
  bytes(arr) {
    this._grow(arr.length);
    this._a.set(arr instanceof Uint8Array ? arr : new Uint8Array(arr), this._p);
    this._p += arr.length;
  }
  slice() { return this._a.buffer.slice(0, this._p); }
}

// ── 書き込みロジック ──────────────────────────────────────────────────────────
function writeTag(buf, type, name, value) {
  buf.u8(type);
  buf.str(name);
  writePayload(buf, type, value);
}

function writePayload(buf, type, value) {
  switch (type) {
    case T.BYTE:       buf.i8(value);  break;
    case T.SHORT:      buf.i16(value); break;
    case T.INT:        buf.i32(value); break;
    case T.LONG:       buf.i64(value); break;
    case T.FLOAT:      buf.f32(value); break;
    case T.DOUBLE:     buf.f64(value); break;
    case T.STRING:     buf.str(value); break;
    case T.BYTE_ARRAY: buf.i32(value.length); for (const v of value) buf.i8(v);  break;
    case T.INT_ARRAY:  buf.i32(value.length); for (const v of value) buf.i32(v); break;
    case T.LONG_ARRAY:
      buf.i32(value.length);
      for (const v of value) buf.i64(v);
      break;
    case T.LIST: {
      const { type: et, items } = value;
      buf.u8(items.length === 0 ? T.END : et);
      buf.i32(items.length);
      for (const item of items) writePayload(buf, et, item);
      break;
    }
    case T.COMPOUND:
      for (const tag of value) writeTag(buf, tag.type, tag.name, tag.value);
      buf.u8(T.END);
      break;
    default:
      throw new Error(`nbt-writer: unknown tag type ${type}`);
  }
}

// ── 公開 API ──────────────────────────────────────────────────────────────────
export class NBTWriter {
  constructor() { this._buf = new Buf(); }
  /** ルートの named compound タグを書き込む */
  compound(name, tags) { writeTag(this._buf, T.COMPOUND, name, tags); }
  /** ArrayBuffer を返す（GZip 前） */
  build() { return this._buf.slice(); }
}

// ── buildLitematic ────────────────────────────────────────────────────────────
/**
 * 完全な .litematic NBT ファイル（非圧縮）を生成する。
 * 呼び出し側で pako.gzip(buf) して保存すること。
 *
 * @param {{
 *   name: string,
 *   author: string,
 *   dataVersion: number,
 *   dimensions: [number, number, number],
 *   palette: Array<{ Name: string, Properties?: Record<string,string> }>,
 *   blockStates: BigInt64Array,
 * }} opts
 * @returns {ArrayBuffer}
 */
export function buildLitematic({ name, author, dataVersion, dimensions, palette, blockStates, totalBlocks }) {
  const [SX, SY, SZ] = dimensions;
  const now = BigInt(Date.now());
  const regionName = name.replace(/\s/g, '_');
  const nonAirCount = totalBlocks ?? (SX * SY * SZ);

  // BlockStatePalette — TAG_List<TAG_Compound>
  const paletteItems = palette.map(e => {
    const sub = [{ type: T.STRING, name: 'Name', value: e.Name }];
    if (e.Properties && Object.keys(e.Properties).length > 0) {
      sub.push({
        type: T.COMPOUND, name: 'Properties',
        value: Object.entries(e.Properties).map(([k, v]) => ({
          type: T.STRING, name: k, value: String(v),
        })),
      });
    }
    return sub; // TAG_List の各 item は payload のみ（type+name 不要）
  });

  const root = [
    { type: T.INT,    name: 'MinecraftDataVersion', value: dataVersion },
    { type: T.INT,    name: 'Version',              value: 7 },
    { type: T.INT,    name: 'SubVersion',           value: 1 },
    {
      type: T.COMPOUND, name: 'Metadata', value: [
        { type: T.STRING, name: 'Name',         value: name   },
        { type: T.STRING, name: 'Author',       value: author },
        { type: T.STRING, name: 'Description',  value: ''     },
        { type: T.LONG,   name: 'TimeCreated',  value: now },
        { type: T.LONG,   name: 'TimeModified', value: now },
        {
          type: T.COMPOUND, name: 'EnclosingSize', value: [
            { type: T.INT, name: 'x', value: SX },
            { type: T.INT, name: 'y', value: SY },
            { type: T.INT, name: 'z', value: SZ },
          ],
        },
        { type: T.INT, name: 'RegionCount', value: 1 },
        { type: T.INT, name: 'TotalBlocks', value: nonAirCount },
        { type: T.INT, name: 'TotalVolume', value: SX * SY * SZ },
      ],
    },
    {
      type: T.COMPOUND, name: 'Regions', value: [
        {
          type: T.COMPOUND, name: regionName, value: [
            {
              type: T.COMPOUND, name: 'Position', value: [
                { type: T.INT, name: 'x', value: 0 },
                { type: T.INT, name: 'y', value: 0 },
                { type: T.INT, name: 'z', value: 0 },
              ],
            },
            {
              type: T.COMPOUND, name: 'Size', value: [
                { type: T.INT, name: 'x', value: SX },
                { type: T.INT, name: 'y', value: SY },
                { type: T.INT, name: 'z', value: SZ },
              ],
            },
            {
              type: T.LIST, name: 'BlockStatePalette',
              value: { type: T.COMPOUND, items: paletteItems },
            },
            {
              type: T.LONG_ARRAY, name: 'BlockStates',
              value: blockStates,
            },
            { type: T.LIST, name: 'Entities',     value: { type: T.COMPOUND, items: [] } },
            { type: T.LIST, name: 'TileEntities', value: { type: T.COMPOUND, items: [] } },
            { type: T.LONG, name: 'TileEntityCount', value: 0n },
          ],
        },
      ],
    },
  ];

  const writer = new NBTWriter();
  writer.compound('', root);
  return writer.build();
}
