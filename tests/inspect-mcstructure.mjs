// Decode .mcstructure (little-endian NBT) and print palette + sample positions
//
// 使い方: node tests/inspect-mcstructure.mjs <path/to/file.mcstructure>
import fs from 'node:fs';

const path = process.argv[2];
if (!path) {
  console.error('Usage: node tests/inspect-mcstructure.mjs <path/to/file.mcstructure>');
  process.exit(1);
}
const buf = fs.readFileSync(path);
const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
const dec = new TextDecoder('utf-8');

let pos = 0;
const LE = true;

function rByte()   { return view.getInt8(pos++); }
function rUByte()  { return view.getUint8(pos++); }
function rShort()  { const v = view.getInt16(pos, LE);  pos+=2; return v; }
function rInt()    { const v = view.getInt32(pos, LE);  pos+=4; return v; }
function rLong()   { const v = view.getBigInt64(pos, LE); pos+=8; return v; }
function rFloat()  { const v = view.getFloat32(pos, LE); pos+=4; return v; }
function rDouble() { const v = view.getFloat64(pos, LE); pos+=8; return v; }
function rString() {
  const n = view.getUint16(pos, LE); pos+=2;
  const s = dec.decode(buf.subarray(pos, pos+n)); pos+=n;
  return s;
}
function rPayload(t) {
  switch (t) {
    case 1: return rByte();
    case 2: return rShort();
    case 3: return rInt();
    case 4: return rLong();
    case 5: return rFloat();
    case 6: return rDouble();
    case 7: { const n=rInt(); const a=new Int8Array(n); for (let i=0;i<n;i++) a[i]=rByte(); return a; }
    case 8: return rString();
    case 9: { const et=rUByte(); const n=rInt(); const a=[]; for (let i=0;i<n;i++) a.push(rPayload(et)); return {__list:true, elemType:et, items:a}; }
    case 10: { const obj={}; while (true) { const t=rUByte(); if (t===0) break; const name=rString(); obj[name]=rPayload(t); } return obj; }
    case 11: { const n=rInt(); const a=new Int32Array(n); for (let i=0;i<n;i++) a[i]=rInt(); return a; }
    case 12: { const n=rInt(); const a=new BigInt64Array(n); for (let i=0;i<n;i++) a[i]=rLong(); return a; }
    default: throw new Error('unknown tag '+t+' at '+pos);
  }
}

// .mcstructure starts directly with NBT compound at offset 0
pos = 0;
console.log('First bytes:', buf.subarray(0, 16).toString('hex'));

const rootTag = rUByte();  // 0x0a = COMPOUND
const rootName = rString();
const root = rPayload(10);

console.log('Root name:', JSON.stringify(rootName));
console.log('Format version:', root.format_version);
console.log('Size:', root.size?.items);

const structure = root.structure;
const palette = structure?.palette?.default?.block_palette?.items ?? [];

console.log('\n=== Palette (trapdoors only) ===');
palette.forEach((entry, idx) => {
  const name = entry.name;
  if (name && name.includes('trapdoor')) {
    console.log(`  idx=${idx} ${name}`, JSON.stringify(entry.states));
  }
});

// Print block_indices summary for trapdoors
const layer0 = structure?.block_indices?.items?.[0]?.items ?? [];
const trapIndices = new Set();
palette.forEach((entry, idx) => {
  if (entry.name && entry.name.includes('trapdoor')) trapIndices.add(idx);
});

const sizeArr = root.size?.items ?? [0,0,0];
const [SX, SY, SZ] = sizeArr;
console.log('\nSX, SY, SZ:', SX, SY, SZ);

console.log('\n=== Trapdoor positions (first 20, BE coord) ===');
let count = 0;
for (let i = 0; i < layer0.length && count < 20; i++) {
  if (trapIndices.has(layer0[i])) {
    // BE order: idx = x*SY*SZ + y*SZ + z
    const x = Math.floor(i / (SY * SZ));
    const y = Math.floor((i % (SY * SZ)) / SZ);
    const z = i % SZ;
    const entry = palette[layer0[i]];
    console.log(`  (x=${x},y=${y},z=${z}) idx=${layer0[i]} ${entry.name} ${JSON.stringify(entry.states)}`);
    count++;
  }
}
