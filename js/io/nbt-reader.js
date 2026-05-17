/**
 * NBT Parser - Bedrock (Little Endian) と Java (Big Endian) の両対応
 * モードはコンストラクタの第2引数で切替: 'le' (default) / 'be'
 *
 * 使用例:
 *   const parser = new NBTParser(buffer, 'le');  // Bedrock .mcstructure
 *   const parser = new NBTParser(buffer, 'be');  // Java .nbt
 *   parser.parse();
 */
export class NBTParser {
    constructor(buffer, endian = 'le') {
        this.view = new DataView(buffer);
        this.offset = 0;
        this.littleEndian = endian === 'le';
    }

    parse() {
        const type = this.readByte();
        if (type === 0) return null;
        const name = this.readString();
        return { name, value: this.readTag(type) };
    }

    readTag(type) {
        switch (type) {
            case 1: return this.readByte();
            case 2: return this.readShort();
            case 3: return this.readInt();
            case 4: return this.readLong();
            case 5: return this.readFloat();
            case 6: return this.readDouble();
            case 7: return this.readByteArray();
            case 8: return this.readString();
            case 9: return this.readList();
            case 10: return this.readCompound();
            case 11: return this.readIntArray();
            case 12: return this.readLongArray();
            default: throw new Error(`Unknown NBT Tag: ${type} at offset ${this.offset}`);
        }
    }

    readByte() {
        const val = this.view.getInt8(this.offset);
        this.offset += 1;
        return val;
    }
    readShort() {
        const val = this.view.getInt16(this.offset, this.littleEndian);
        this.offset += 2;
        return val;
    }
    readInt() {
        const val = this.view.getInt32(this.offset, this.littleEndian);
        this.offset += 4;
        return val;
    }
    readLong() {
        const val = this.view.getBigInt64(this.offset, this.littleEndian);
        this.offset += 8;
        return Number(val);
    }
    readFloat() {
        const val = this.view.getFloat32(this.offset, this.littleEndian);
        this.offset += 4;
        return val;
    }
    readDouble() {
        const val = this.view.getFloat64(this.offset, this.littleEndian);
        this.offset += 8;
        return val;
    }
    readByteArray() {
        const length = this.readInt();
        const array = new Int8Array(this.view.buffer, this.view.byteOffset + this.offset, length);
        this.offset += length;
        return Array.from(array);
    }
    readString() {
        // Java の文字列長は unsigned short (Big Endian)、Bedrock は signed short Little Endian。
        // どちらも値が正の通常範囲なら getUint16 で OK。
        const length = this.view.getUint16(this.offset, this.littleEndian);
        this.offset += 2;
        if (length === 0) return '';
        const bytes = new Uint8Array(this.view.buffer, this.view.byteOffset + this.offset, length);
        const decoder = new TextDecoder();
        const str = decoder.decode(bytes);
        this.offset += length;
        return str;
    }
    readList() {
        const type = this.readByte();
        const length = this.readInt();
        const list = [];
        for (let i = 0; i < length; i++) list.push(this.readTag(type));
        Object.defineProperty(list, '__elementType', {
            value: type, writable: true, configurable: true, enumerable: false
        });
        return list;
    }
    readCompound() {
        const obj = {};
        const types = {};
        while (true) {
            const type = this.readByte();
            if (type === 0) break;
            const name = this.readString();
            types[name] = type;
            obj[name] = this.readTag(type);
        }
        // 型情報を non-enumerable で保持（JSON.stringify 等の出力には載らない）
        Object.defineProperty(obj, '__types', {
            value: types, writable: true, configurable: true, enumerable: false
        });
        return obj;
    }
    readIntArray() {
        const length = this.readInt();
        const array = new Array(length);
        for (let i = 0; i < length; i++) array[i] = this.readInt();
        return array;
    }
    readLongArray() {
        const length = this.readInt();
        const array = new Array(length);
        for (let i = 0; i < length; i++) array[i] = this.readLong();
        return array;
    }
}

/* ─── 形式自動判定ヘルパー ────────────────────────────────────────────
 * GZip 圧縮されている場合の magic 0x1f 0x8b 検出後に解凍し、
 * 解凍後の先頭バイトで Bedrock / Java を判定して NBTParser を返す。
 *
 * 判定ロジック:
 *   - Bedrock .mcstructure: 先頭 4byte に Little-Endian の format_version=1（0x0a 0x00 で始まる Compound name 形式）
 *   - Java .nbt: 先頭が 0x0a 0x00 の Compound、または 0x0a 0x00 0x00 など。
 *   - 区別の決定打：
 *       Bedrock の root は名前なし TAG_Compound で 0x0a 00 00 (type=Compound, name length=0 LE)
 *       Java の root は通常 名前付き TAG_Compound で 0x0a 00 NN (type=Compound, name length=NN BE)
 *   - 簡易判定: 0x0a 0x00 0x00 のあと続くバイトを見て Compound/Int 等の有効 NBT タグなら Bedrock 寄り、
 *               String length が短く ASCII 文字が続けば Java 寄り。
 *   実用上は拡張子で判定するのが速い → fileName を一緒に渡してヒントにする。
 */
export async function decompressIfNeeded(arrayBuffer) {
    const head = new Uint8Array(arrayBuffer, 0, Math.min(4, arrayBuffer.byteLength));
    if (head[0] === 0x1f && head[1] === 0x8b) {
        const stream = new Blob([arrayBuffer]).stream().pipeThrough(new DecompressionStream('gzip'));
        return await new Response(stream).arrayBuffer();
    }
    return arrayBuffer;
}

/**
 * 形式自動判定（fileName のヒント付き）
 * @param {ArrayBuffer} buffer 解凍済み NBT バイト列
 * @param {string} fileName    オリジナルのファイル名（'.mcstructure' / '.nbt' / '.litematic' 等）
 * @returns {'le' | 'be'}
 */
export function detectEndian(buffer, fileName = '') {
    const lower = String(fileName).toLowerCase();
    if (lower.endsWith('.mcstructure')) return 'le';
    if (lower.endsWith('.nbt') || lower.endsWith('.litematic') || lower.endsWith('.dat')) return 'be';

    // ファイル名ヒント無し → ヒューリスティック
    const v = new DataView(buffer);
    if (buffer.byteLength < 4) return 'le';
    // root は TAG_Compound で始まるはず
    if (v.getUint8(0) !== 0x0a) return 'le';  // とりあえず Bedrock デフォルト
    // 名前長 LE と BE のどちらが妥当か
    const lenLE = v.getUint16(1, true);
    const lenBE = v.getUint16(1, false);
    if (lenBE > 0 && lenBE < 64 && 3 + lenBE < buffer.byteLength) {
        // Java 形式: 名前あり root
        return 'be';
    }
    if (lenLE === 0) {
        // Bedrock 形式: 名前なし root
        return 'le';
    }
    return 'le';
}

/* ─── NBT Writer (Bedrock LE / Java BE 両対応) ─────────────────────────
 * 簡易: Bedrock の .mcstructure 出力を主目的とする。
 *
 * 使い方:
 *   const w = new NBTWriter('le');
 *   w.writeRoot({ name: '', value: { format_version: 1, size: [...], structure: { ... } } });
 *   const buffer = w.toArrayBuffer();
 */
export class NBTWriter {
    constructor(endian = 'le') {
        this.littleEndian = endian === 'le';
        this.chunks = [];          // ArrayBuffer 等の小片配列
        this._tmp = new ArrayBuffer(8);
        this._tmpView = new DataView(this._tmp);
    }

    /** ルート書き出し: { name, value } を受け取る */
    writeRoot(root) {
        // ルートは TAG_Compound (10) であることを前提
        this.writeByte(10);
        this.writeString(root.name || '');
        this._writeCompoundContents(root.value);
    }

    writeByte(v) {
        const buf = new ArrayBuffer(1);
        new DataView(buf).setInt8(0, v);
        this.chunks.push(buf);
    }
    writeShort(v) {
        const buf = new ArrayBuffer(2);
        new DataView(buf).setInt16(0, v, this.littleEndian);
        this.chunks.push(buf);
    }
    writeUShort(v) {
        const buf = new ArrayBuffer(2);
        new DataView(buf).setUint16(0, v, this.littleEndian);
        this.chunks.push(buf);
    }
    writeInt(v) {
        const buf = new ArrayBuffer(4);
        new DataView(buf).setInt32(0, v, this.littleEndian);
        this.chunks.push(buf);
    }
    writeLong(v) {
        const buf = new ArrayBuffer(8);
        new DataView(buf).setBigInt64(0, BigInt(v), this.littleEndian);
        this.chunks.push(buf);
    }
    writeFloat(v) {
        const buf = new ArrayBuffer(4);
        new DataView(buf).setFloat32(0, v, this.littleEndian);
        this.chunks.push(buf);
    }
    writeDouble(v) {
        const buf = new ArrayBuffer(8);
        new DataView(buf).setFloat64(0, v, this.littleEndian);
        this.chunks.push(buf);
    }
    writeString(str) {
        const bytes = new TextEncoder().encode(str || '');
        this.writeUShort(bytes.length);
        this.chunks.push(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
    }
    writeByteArray(arr) {
        this.writeInt(arr.length);
        const buf = new Uint8Array(arr.length);
        for (let i = 0; i < arr.length; i++) buf[i] = arr[i] & 0xff;
        this.chunks.push(buf.buffer);
    }
    writeIntArray(arr) {
        this.writeInt(arr.length);
        for (let i = 0; i < arr.length; i++) this.writeInt(arr[i]);
    }

    /** 値の型を推測してタグIDを返す。明示が必要なら type ヒント */
    _inferType(v, hint) {
        if (hint) return hint;
        if (v === null || v === undefined) return 0;
        if (typeof v === 'string') return 8;
        if (Array.isArray(v)) {
            // 配列はリスト or IntArray
            if (v.length > 0 && typeof v[0] === 'object' && v[0] !== null && !Array.isArray(v[0])) return 9; // List of Compound
            return 9; // 既定: List
        }
        if (typeof v === 'object') return 10; // Compound
        if (typeof v === 'number') {
            if (Number.isInteger(v)) {
                if (v >= -128 && v <= 127) return 1;
                if (v >= -32768 && v <= 32767) return 2;
                if (v >= -2147483648 && v <= 2147483647) return 3;
                return 4;
            }
            return 5; // Float（既定）
        }
        return 8;
    }

    _writeTag(type, value) {
        switch (type) {
            case 1: this.writeByte(value); break;
            case 2: this.writeShort(value); break;
            case 3: this.writeInt(value); break;
            case 4: this.writeLong(value); break;
            case 5: this.writeFloat(value); break;
            case 6: this.writeDouble(value); break;
            case 7: this.writeByteArray(value); break;
            case 8: this.writeString(value); break;
            case 9: this._writeList(value); break;
            case 10: this._writeCompoundContents(value); break;
            case 11: this.writeIntArray(value); break;
            default: throw new Error('unsupported tag type: ' + type);
        }
    }

    _writeList(arr) {
        // 元 NBT の型情報があれば優先（Object.defineProperty で付与されたもの）
        let elemType = arr.__elementType;
        if (!elemType) {
            if (arr.length === 0) elemType = 0;
            else elemType = this._inferType(arr[0]);
        }
        this.writeByte(elemType);
        this.writeInt(arr.length);
        for (const v of arr) this._writeTag(elemType, v);
    }

    _writeCompoundContents(obj) {
        const types = obj.__types || {};
        for (const key of Object.keys(obj)) {
            if (key === '__types' || key === '__elementType') continue;
            const value = obj[key];
            const type = types[key] || this._inferType(value);
            this.writeByte(type);
            this.writeString(key);
            this._writeTag(type, value);
        }
        this.writeByte(0); // TAG_End
    }

    toArrayBuffer() {
        let total = 0;
        for (const c of this.chunks) total += c.byteLength;
        const out = new Uint8Array(total);
        let offset = 0;
        for (const c of this.chunks) {
            out.set(new Uint8Array(c), offset);
            offset += c.byteLength;
        }
        return out.buffer;
    }
}
