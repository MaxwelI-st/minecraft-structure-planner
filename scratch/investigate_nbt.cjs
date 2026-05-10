const fs = require('fs');
const zlib = require('zlib');

class NBTParser {
    constructor(buffer, endian = 'le') {
        this.buffer = buffer;
        this.offset = 0;
        this.littleEndian = endian === 'le';
    }
    readByte() { return this.buffer.readInt8(this.offset++); }
    readShort() { const v = this.littleEndian ? this.buffer.readInt16LE(this.offset) : this.buffer.readInt16BE(this.offset); this.offset += 2; return v; }
    readInt() { const v = this.littleEndian ? this.buffer.readInt32LE(this.offset) : this.buffer.readInt32BE(this.offset); this.offset += 4; return v; }
    readLong() { const v = this.littleEndian ? this.buffer.readBigInt64LE(this.offset) : this.buffer.readBigInt64BE(this.offset); this.offset += 8; return Number(v); }
    readFloat() { const v = this.littleEndian ? this.buffer.readFloatLE(this.offset) : this.buffer.readFloatBE(this.offset); this.offset += 4; return v; }
    readDouble() { const v = this.littleEndian ? this.buffer.readDoubleLE(this.offset) : this.buffer.readDoubleBE(this.offset); this.offset += 8; return v; }
    readString() {
        const len = this.littleEndian ? this.buffer.readUInt16LE(this.offset) : this.buffer.readUInt16BE(this.offset);
        this.offset += 2;
        const str = this.buffer.toString('utf8', this.offset, this.offset + len);
        this.offset += len;
        return str;
    }
    readTag(type) {
        switch (type) {
            case 1: return this.readByte();
            case 2: return this.readShort();
            case 3: return this.readInt();
            case 4: return this.readLong();
            case 5: return this.readFloat();
            case 6: return this.readDouble();
            case 7: { const len = this.readInt(); const b = this.buffer.slice(this.offset, this.offset + len); this.offset += len; return Array.from(b); }
            case 8: return this.readString();
            case 9: { const t = this.readByte(); const len = this.readInt(); const l = []; for(let i=0; i<len; i++) l.push(this.readTag(t)); return l; }
            case 10: { const obj = {}; while(true) { const t = this.readByte(); if(t === 0) break; const name = this.readString(); obj[name] = this.readTag(t); } return obj; }
            case 11: { const len = this.readInt(); const a = []; for(let i=0; i<len; i++) a.push(this.readInt()); return a; }
            default: throw new Error('Unknown tag ' + type + ' at offset ' + this.offset);
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
    if (buffer[0] === 0x1f && buffer[1] === 0x8b) buffer = zlib.gunzipSync(buffer);
    const parser = new NBTParser(buffer, 'le');
    const root = parser.parse().value;
    const pal = root.structure.palette.default.block_palette;
    const layers = root.structure.block_indices;
    const [sx, sy, sz] = root.size;

    function isTop(idx) {
        if (idx === -1) return false;
        const entry = pal[idx];
        if (!entry.name.includes('slab') && !entry.name.includes('stairs')) return false;
        const s = entry.states || {};
        const v = s['minecraft:vertical_half'] || s['vertical_half'] || s['top_slot_bit'] || s['upside_down_bit'];
        const val = (v && typeof v === 'object') ? v.value : v;
        return val === 'top' || val === 1 || val === true;
    }
    function isBottom(idx) {
        if (idx === -1) return false;
        const entry = pal[idx];
        if (!entry.name.includes('slab') && !entry.name.includes('stairs')) return false;
        return !isTop(idx);
    }

    let stackedCount = 0;
    for (let x=0; x<sx; x++) {
        for (let y=1; y<sy; y++) {
            for (let z=0; z<sz; z++) {
                const iLower = (x * sy * sz) + ((y-1) * sz) + z;
                const iUpper = (x * sy * sz) + (y * sz) + z;
                
                const l0_low = layers[0][iLower];
                const l0_up  = layers[0][iUpper];
                
                if (isTop(l0_low) && isBottom(l0_up)) {
                    stackedCount++;
                    if (stackedCount < 10) {
                        console.log(`Stacked pair at (${x}, ${y}, ${z}): LowerY=${pal[l0_low].name}(top), UpperY=${pal[l0_up].name}(bottom)`);
                    }
                }
            }
        }
    }
    console.log(`Total stacked pairs (Y-1 top + Y bottom) found: ${stackedCount}`);
}

const path = 'C:/Users/maita/Downloads/WheatFarmersq.mcstructure';
investigate(path);
