// Minimal NBT parser to inspect .litematic content
// Usage: node tests/inspect-litematic.mjs <path>

import fs from 'node:fs';
import zlib from 'node:zlib';

const TAGS = {
  0: 'END', 1: 'BYTE', 2: 'SHORT', 3: 'INT', 4: 'LONG',
  5: 'FLOAT', 6: 'DOUBLE', 7: 'BYTE_ARRAY', 8: 'STRING',
  9: 'LIST', 10: 'COMPOUND', 11: 'INT_ARRAY', 12: 'LONG_ARRAY',
};

class NBTReader {
  constructor(buf) { this.buf = buf; this.view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength); this.pos = 0; }
  readByte()   { return this.view.getInt8(this.pos++); }
  readUByte()  { return this.view.getUint8(this.pos++); }
  readShort()  { const v = this.view.getInt16(this.pos, false);  this.pos += 2; return v; }
  readInt()    { const v = this.view.getInt32(this.pos, false);  this.pos += 4; return v; }
  readLong()   { const v = this.view.getBigInt64(this.pos, false); this.pos += 8; return v; }
  readFloat()  { const v = this.view.getFloat32(this.pos, false); this.pos += 4; return v; }
  readDouble() { const v = this.view.getFloat64(this.pos, false); this.pos += 8; return v; }
  readString() { const len = this.view.getUint16(this.pos, false); this.pos += 2; const s = new TextDecoder('utf-8').decode(this.buf.subarray(this.pos, this.pos + len)); this.pos += len; return s; }
  readPayload(type) {
    switch (type) {
      case 1: return this.readByte();
      case 2: return this.readShort();
      case 3: return this.readInt();
      case 4: return this.readLong();
      case 5: return this.readFloat();
      case 6: return this.readDouble();
      case 7: { const n = this.readInt(); const a = new Int8Array(n); for (let i=0;i<n;i++) a[i]=this.readByte(); return a; }
      case 8: return this.readString();
      case 9: { const elemType = this.readUByte(); const n = this.readInt(); const arr = []; for (let i=0;i<n;i++) arr.push(this.readPayload(elemType)); return { __list: true, elemType, items: arr }; }
      case 10: { const obj = {}; while (true) { const t = this.readUByte(); if (t === 0) break; const name = this.readString(); obj[name] = this.readPayload(t); } return obj; }
      case 11: { const n = this.readInt(); const a = new Int32Array(n); for (let i=0;i<n;i++) a[i]=this.readInt(); return a; }
      case 12: { const n = this.readInt(); const a = new BigInt64Array(n); for (let i=0;i<n;i++) a[i]=this.readLong(); return a; }
      default: throw new Error('Unknown tag type ' + type);
    }
  }
  readRoot() {
    const t = this.readUByte();
    if (t !== 10) throw new Error('Expected root TAG_Compound');
    const name = this.readString();
    const val = this.readPayload(10);
    return { name, value: val };
  }
}

const path = process.argv[2] || 'C:/Users/maita/Downloads/WheatFarmersqb_2structs.litematic';
const compressed = fs.readFileSync(path);
const decompressed = zlib.gunzipSync(compressed);

const reader = new NBTReader(decompressed);
const root = reader.readRoot();
const r = root.value;

console.log('DataVersion:', r.MinecraftDataVersion);
console.log('Version:', r.Version);
console.log('Author:', r.Metadata?.Author);
console.log('Name:', r.Metadata?.Name);
console.log('EnclosingSize:', r.Metadata?.EnclosingSize);
console.log('TotalBlocks:', r.Metadata?.TotalBlocks);

const regions = r.Regions;
const regionName = Object.keys(regions)[0];
console.log('\nRegion:', regionName);
const region = regions[regionName];
console.log('Size:', region.Size);

// Bit-unpack BlockStates
function bitsFor(n) { return Math.max(4, Math.ceil(Math.log2(Math.max(n, 2)))); }
function unpack(longs, total, paletteSize) {
  const bpe = bitsFor(paletteSize);
  const epl = Math.floor(64 / bpe);
  const mask = (1n << BigInt(bpe)) - 1n;
  const out = new Uint16Array(total);
  for (let i = 0; i < total; i++) {
    const li = Math.floor(i / epl);
    const off = (i % epl) * bpe;
    out[i] = Number((BigInt.asUintN(64, longs[li]) >> BigInt(off)) & mask);
  }
  return out;
}

const palette = region.BlockStatePalette.items;
const blockStates = region.BlockStates;
const SX = Math.abs(region.Size.x), SY = Math.abs(region.Size.y), SZ = Math.abs(region.Size.z);
const total = SX * SY * SZ;

console.log('\nDimensions:', SX, 'x', SY, 'x', SZ, '=', total);
console.log('Palette size:', palette.length);
console.log('BlockStates longs:', blockStates.length);

// Show palette entries (slabs / trapdoors / doors only)
console.log('\n=== Palette (slab/trapdoor/door) ===');
for (let i = 0; i < palette.length; i++) {
  const e = palette[i];
  const name = e.Name;
  if (name.endsWith('_slab') || name.endsWith('_trapdoor') || name.endsWith('_door')) {
    const props = e.Properties ? Object.entries(e.Properties).map(([k,v]) => `${k}=${v}`).join(',') : '';
    console.log(`  idx=${i.toString().padStart(3)} ${name}[${props}]`);
  }
}

// Unpack and histogram
const unpacked = unpack(blockStates, total, palette.length);
const hist = new Map();
for (let i = 0; i < total; i++) {
  const idx = unpacked[i];
  hist.set(idx, (hist.get(idx) || 0) + 1);
}
console.log('\n=== Histogram (slab/trapdoor/door usage) ===');
for (let i = 0; i < palette.length; i++) {
  const e = palette[i];
  const name = e.Name;
  if (name.endsWith('_slab') || name.endsWith('_trapdoor') || name.endsWith('_door')) {
    const count = hist.get(i) || 0;
    const props = e.Properties ? Object.entries(e.Properties).map(([k,v]) => `${k}=${v}`).join(',') : '';
    console.log(`  idx=${i.toString().padStart(3)} count=${count.toString().padStart(4)} ${name}[${props}]`);
  }
}

// Sample first 10 dark_oak_slab top positions in YZX coords
const targetIdx = palette.findIndex(e => e.Name === 'minecraft:dark_oak_slab' && e.Properties?.type === 'top');
console.log('\n=== dark_oak_slab[top] (palette idx=' + targetIdx + ') first 10 positions in YZX coords ===');
if (targetIdx >= 0) {
  let count = 0;
  for (let i = 0; i < total && count < 10; i++) {
    if (unpacked[i] === targetIdx) {
      const y = Math.floor(i / (SX * SZ));
      const z = Math.floor((i % (SX * SZ)) / SX);
      const x = i % SX;
      console.log(`  yzxIdx=${i} → (x=${x}, y=${y}, z=${z})`);
      count++;
    }
  }
}

// Same for nether_brick_slab top
const nbTop = palette.findIndex(e => e.Name === 'minecraft:nether_brick_slab' && e.Properties?.type === 'top');
console.log('\n=== nether_brick_slab[top] (palette idx=' + nbTop + ') first 5 positions ===');
if (nbTop >= 0) {
  let count = 0;
  for (let i = 0; i < total && count < 5; i++) {
    if (unpacked[i] === nbTop) {
      const y = Math.floor(i / (SX * SZ));
      const z = Math.floor((i % (SX * SZ)) / SX);
      const x = i % SX;
      console.log(`  yzxIdx=${i} → (x=${x}, y=${y}, z=${z})`);
      count++;
    }
  }
}
