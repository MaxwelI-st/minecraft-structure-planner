const fs = require('fs');
const zlib = require('zlib');

// NBT Parser logic adapted for Node.js
class NBTParser {
    constructor(buffer, endian = 'le') {
        this.view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        this.offset = 0;
        this.littleEndian = endian === 'le';
    }
    readByte() { return this.view.getInt8(this.offset++); }
    readShort() { const v = this.view.getInt16(this.offset, this.littleEndian); this.offset += 2; return v; }
    readInt() { const v = this.view.getInt32(this.offset, this.littleEndian); this.offset += 4; return v; }
    readLong() { const v = this.view.getBigInt64(this.offset, this.littleEndian); this.offset += 8; return Number(v); }
    readFloat() { const v = this.view.getFloat32(this.offset, this.littleEndian); this.offset += 4; return v; }
    readDouble() { const v = this.view.getFloat64(this.offset, this.littleEndian); this.offset += 8; return v; }
    readString() {
        const len = this.view.getUint16(this.offset, this.littleEndian);
        this.offset += 2;
        const bytes = Buffer.from(this.view.buffer, this.view.byteOffset + this.offset, len);
        this.offset += len;
        return bytes.toString('utf8');
    }
    readTag(type) {
        switch (type) {
            case 1: return this.readByte();
            case 2: return this.readShort();
            case 3: return this.readInt();
            case 4: return this.readLong();
            case 5: return this.readFloat();
            case 6: return this.readDouble();
            case 7: { const len = this.readInt(); const b = Buffer.from(this.view.buffer, this.view.byteOffset + this.offset, len); this.offset += len; return Array.from(b); }
            case 8: return this.readString();
            case 9: { const t = this.readByte(); const len = this.readInt(); const l = []; for(let i=0; i<len; i++) l.push(this.readTag(t)); return l; }
            case 10: { const obj = {}; while(true) { const t = this.readByte(); if(t === 0) break; const name = this.readString(); obj[name] = this.readTag(t); } return obj; }
            case 11: { const len = this.readInt(); const a = []; for(let i=0; i<len; i++) a.push(this.readInt()); return a; }
            default: throw new Error('Unknown tag ' + type);
        }
    }
    parse() {
        const type = this.readByte();
        if (type === 0) return null;
        const name = this.readString();
        return { name, value: this.readTag(type) };
    }
}

function investigate(filePath) {
    let buffer = fs.readFileSync(filePath);
    if (buffer[0] === 0x1f && buffer[1] === 0x8b) {
        buffer = zlib.gunzipSync(buffer);
    }
    
    const parser = new NBTParser(buffer, 'le');
    const root = parser.parse().value;
    
    const size = root.size;
    const [sx, sy, sz] = size;
    console.log(`Structure Size: ${sx}x${sy}x${sz}`);
    
    const palette = root.structure.palette.default.block_palette;
    console.log(`\nPalette (${palette.length} entries):`);
    palette.forEach((entry, i) => {
        console.log(`[${i}] ${entry.name} ${JSON.stringify(entry.states || {})}`);
    });
    
    const layers = root.structure.block_indices;
    console.log(`\nLayers: ${layers.length}`);
    
    // Check for multiple blocks at the same coordinate
    const overlapCount = 0;
    const overlaps = [];
    
    for (let i = 0; i < layers[0].length; i++) {
        const l0 = layers[0][i];
        const l1 = (layers[1] && layers[1][i] !== undefined) ? layers[1][i] : -1;
        
        if (l0 !== -1 && l1 !== -1) {
            const z = i % sz;
            const y = Math.floor(i / sz) % sy;
            const x = Math.floor(i / (sy * sz));
            
            const b0 = palette[l0];
            const b1 = palette[l1];
            
            if (b1.name !== 'minecraft:air') {
                overlaps.push({ x, y, z, b0, b1 });
            }
        }
    }
    
    if (overlaps.length > 0) {
        console.log(`\nFound ${overlaps.length} overlapping blocks (excluding air):`);
        overlaps.slice(0, 20).forEach(o => {
            console.log(`@(${o.x},${o.y},${o.z}): Layer0=${o.b0.name}, Layer1=${o.b1.name}`);
        });
        if (overlaps.length > 20) console.log('... (truncated)');
    } else {
        console.log('\nNo overlapping blocks found in Layer 1.');
    }
    
    // Check for doors specifically
    console.log('\nScanning for doors:');
    for (let i = 0; i < layers[0].length; i++) {
        const idx = layers[0][i];
        if (idx === -1) continue;
        const b = palette[idx];
        if (b.name.includes('door')) {
            const z = i % sz;
            const y = Math.floor(i / sz) % sy;
            const x = Math.floor(i / (sy * sz));
            console.log(`Door at (${x},${y},${z}): ${b.name} states=${JSON.stringify(b.states || {})}`);
        }
    }
}

const path = 'C:/Users/maita/Downloads/WheatFarmersq.mcstructure';
investigate(path);
