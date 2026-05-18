/**
 * nbt-reader.js — DataView-based Streaming NBT Reader
 * Design: 02_TECHNICAL_REFERENCE §1, §2
 * - カーソルベースAPI、フルオブジェクト構築禁止
 * - Bedrock(LE) / Java(BE) 両対応
 * - 8バイトBedrockヘッダー自動ストリップ
 * - Web Worker内で安全に動作（DOM/Node.js依存なし）
 */

export const TAG = Object.freeze({
  END: 0, BYTE: 1, SHORT: 2, INT: 3, LONG: 4,
  FLOAT: 5, DOUBLE: 6, BYTE_ARRAY: 7, STRING: 8,
  LIST: 9, COMPOUND: 10, INT_ARRAY: 11, LONG_ARRAY: 12,
});

export class NBTReader {
  constructor(buffer, { format = 'bedrock' } = {}) {
    if (!(buffer instanceof ArrayBuffer)) throw new TypeError('NBTReader: buffer must be an ArrayBuffer');
    this.format = format;
    this.le = format === 'bedrock';

    if (format === 'bedrock') {
      // 8バイト Bedrock ヘッダー（storageVersion + payloadLength）の自動検出
      // バイト0が TAG_Compound(10) なら直接 NBT が始まっている（ヘッダーなし）
      const firstByte = new DataView(buffer).getUint8(0);
      if (firstByte === 0x0a) {
        // ヘッダーなし形式（一部の .mcstructure / ストリップ済みバッファ）
        this._storageVersion = 0;
        this._payloadLength  = buffer.byteLength;
        this._buffer = buffer;
      } else {
        const headerView = new DataView(buffer, 0, Math.min(8, buffer.byteLength));
        this._storageVersion = headerView.getInt32(0, true);
        this._payloadLength  = headerView.getInt32(4, true);
        if (this._storageVersion !== 8) {
          console.warn(`NBTReader: unexpected Bedrock storage version ${this._storageVersion} (expected 8).`);
        }
        this._buffer = buffer.slice(8);
      }
    } else {
      this._buffer = buffer;
    }
    this._view = new DataView(this._buffer);
  }

  readByte(offset)   { return { value: this._view.getInt8(offset),              next: offset + 1 }; }
  readUByte(offset)  { return { value: this._view.getUint8(offset),             next: offset + 1 }; }
  readShort(offset)  { return { value: this._view.getInt16(offset, this.le),    next: offset + 2 }; }
  readInt(offset)    { return { value: this._view.getInt32(offset, this.le),    next: offset + 4 }; }
  readFloat(offset)  { return { value: this._view.getFloat32(offset, this.le),  next: offset + 4 }; }
  readDouble(offset) { return { value: this._view.getFloat64(offset, this.le),  next: offset + 8 }; }

  readLong(offset) {
    if (this.le) {
      const lo = BigInt(this._view.getUint32(offset,     true));
      const hi = BigInt(this._view.getInt32( offset + 4, true));
      return { value: (hi << 32n) | lo, next: offset + 8 };
    } else {
      const hi = BigInt(this._view.getInt32( offset,     false));
      const lo = BigInt(this._view.getUint32(offset + 4, false));
      return { value: (hi << 32n) | lo, next: offset + 8 };
    }
  }

  readString(offset) {
    const len   = this._view.getUint16(offset, this.le);
    const bytes = new Uint8Array(this._buffer, offset + 2, len);
    return { value: new TextDecoder('utf-8').decode(bytes), next: offset + 2 + len };
  }

  readByteArray(offset) {
    const { value: count, next: start } = this.readInt(offset);
    return { value: new Uint8Array(this._buffer, start, count), count, next: start + count };
  }

  readIntArray(offset) {
    const { value: count, next: start } = this.readInt(offset);
    // Int32Array をバッファビューとして直に作るとアラインメント(4の倍数)とエンディアン
    // (プラットフォーム依存)の両方で破綻するため、ヒープに新規確保して DataView 経由で
    // 明示的に this.le フラグでデコードする。readLongArray と同じパターン。
    const out = new Int32Array(count);
    for (let i = 0; i < count; i++) {
      out[i] = this._view.getInt32(start + i * 4, this.le);
    }
    return { value: out, count, next: start + count * 4 };
  }

  readLongArray(offset) {
    const { value: count, next: start } = this.readInt(offset);
    // BigInt64Array をバッファビューとして直に作るとアラインメント(8の倍数)とエンディアン
    // (プラットフォーム依存)の両方で破綻するため、ヒープに新規確保して DataView 経由で
    // 明示的に this.le フラグでデコードする。
    const out = new BigInt64Array(count);
    for (let i = 0; i < count; i++) {
      out[i] = this._view.getBigInt64(start + i * 8, this.le);
    }
    return { value: out, count, next: start + count * 8 };
  }

  readPayload(typeId, offset) {
    switch (typeId) {
      case TAG.BYTE:       return this.readByte(offset);
      case TAG.SHORT:      return this.readShort(offset);
      case TAG.INT:        return this.readInt(offset);
      case TAG.LONG:       return this.readLong(offset);
      case TAG.FLOAT:      return this.readFloat(offset);
      case TAG.DOUBLE:     return this.readDouble(offset);
      case TAG.BYTE_ARRAY: return this.readByteArray(offset);
      case TAG.STRING:     return this.readString(offset);
      case TAG.INT_ARRAY:  return this.readIntArray(offset);
      case TAG.LONG_ARRAY: return this.readLongArray(offset);
      case TAG.COMPOUND:   return { value: { __type: 'compound', offset }, next: this._skipCompound(offset) };
      case TAG.LIST:       return { value: { __type: 'list', offset },     next: this._skipList(offset) };
      case TAG.END:        return { value: null, next: offset };
      default: throw new RangeError(`NBTReader: unknown tag type ${typeId} at offset ${offset}`);
    }
  }

  readTag(offset) {
    const { value: typeId, next: afterType } = this.readUByte(offset);
    if (typeId === TAG.END) return { typeId: TAG.END, name: '', value: null, next: afterType };
    const { value: name, next: afterName } = this.readString(afterType);
    const { value, next } = this.readPayload(typeId, afterName);
    return { typeId, name, value, next };
  }

  *walkCompound(offset) {
    let cursor = offset;
    while (cursor < this._view.byteLength) {
      const tag = this.readTag(cursor);
      cursor = tag.next;
      if (tag.typeId === TAG.END) break;
      yield tag;
    }
  }

  readCompoundObject(offset) {
    const obj = {};
    let cursor = offset;
    while (cursor < this._view.byteLength) {
      const tag = this.readTag(cursor);
      cursor = tag.next;
      if (tag.typeId === TAG.END) break;
      obj[tag.name] = tag.value;
    }
    return { obj, next: cursor };
  }

  *walkList(offset) {
    const { value: elemType, next: afterType } = this.readUByte(offset);
    const { value: count,    next: afterCount } = this.readInt(afterType);
    let cursor = afterCount;
    for (let i = 0; i < count; i++) {
      const { value, next } = this.readPayload(elemType, cursor);
      yield { index: i, typeId: elemType, value, next };
      cursor = next;
    }
  }

  readListArray(offset) {
    const { value: elemType, next: afterType } = this.readUByte(offset);
    const { value: count,    next: afterCount } = this.readInt(afterType);
    const arr = [];
    let cursor = afterCount;
    for (let i = 0; i < count; i++) {
      const { value, next } = this.readPayload(elemType, cursor);
      arr.push(value);
      cursor = next;
    }
    return { arr, elemType, next: cursor };
  }

  findInCompound(offset, name) {
    for (const tag of this.walkCompound(offset)) {
      if (tag.name === name) return tag;
    }
    return null;
  }

  getRoot() {
    const { value: typeId, next: afterType } = this.readUByte(0);
    if (typeId !== TAG.COMPOUND) {
      throw new Error(`NBTReader: root tag is type ${typeId}, expected TAG_Compound (10).`);
    }
    const { value: name, next: bodyOffset } = this.readString(afterType);
    return { name, bodyOffset };
  }

  _skipCompound(offset) {
    let cursor = offset;
    while (cursor < this._view.byteLength) {
      const { value: typeId, next: afterType } = this.readUByte(cursor);
      if (typeId === TAG.END) return afterType;
      const { next: afterName } = this.readString(afterType);
      const { next } = this.readPayload(typeId, afterName);
      cursor = next;
    }
    return cursor;
  }

  _skipList(offset) {
    const { value: elemType, next: afterType } = this.readUByte(offset);
    const { value: count,    next: afterCount } = this.readInt(afterType);
    let cursor = afterCount;
    for (let i = 0; i < count; i++) {
      const { next } = this.readPayload(elemType, cursor);
      cursor = next;
    }
    return cursor;
  }

  get byteLength() { return this._buffer.byteLength; }
  get storageVersion() { return this._storageVersion; }
}
