/**
 * nbt-reader.js — DataView-based Streaming NBT Reader
 *
 * Design principles (from 02_TECHNICAL_REFERENCE §1, §2):
 *  - NEVER builds a full nested JS object tree from NBT. All reads are cursor-based.
 *  - Supports both Little-Endian (Bedrock) and Big-Endian (Java) via constructor flag.
 *  - Automatically strips the 8-byte Bedrock header when format='bedrock'.
 *  - Safe to run inside a Web Worker (no DOM / Node.js dependencies).
 *
 * NBT Tag Type IDs (Minecraft spec):
 *   0=TAG_End  1=TAG_Byte  2=TAG_Short  3=TAG_Int  4=TAG_Long
 *   5=TAG_Float  6=TAG_Double  7=TAG_Byte_Array  8=TAG_String
 *   9=TAG_List  10=TAG_Compound  11=TAG_Int_Array  12=TAG_Long_Array
 */

export const TAG = Object.freeze({
  END:        0,
  BYTE:       1,
  SHORT:      2,
  INT:        3,
  LONG:       4,
  FLOAT:      5,
  DOUBLE:     6,
  BYTE_ARRAY: 7,
  STRING:     8,
  LIST:       9,
  COMPOUND:   10,
  INT_ARRAY:  11,
  LONG_ARRAY: 12,
});

// Byte sizes for scalar tags (used for typed array reads)
const SCALAR_SIZES = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 4, 6: 8 };

// ─────────────────────────────────────────────────────────────────────────────
// NBTReader class
// ─────────────────────────────────────────────────────────────────────────────

export class NBTReader {
  /**
   * @param {ArrayBuffer} buffer - Raw file bytes (including Bedrock header if applicable)
   * @param {object} options
   * @param {'bedrock'|'java'} options.format - 'bedrock' strips 8-byte header; 'java' does not.
   */
  constructor(buffer, { format = 'bedrock' } = {}) {
    if (!(buffer instanceof ArrayBuffer)) {
      throw new TypeError('NBTReader: buffer must be an ArrayBuffer');
    }

    this.format = format;
    // Bedrock = Little-Endian (true), Java = Big-Endian (false)
    this.le = format === 'bedrock';

    // ── Bedrock 8-byte header strip ──────────────────────────────────────────
    // Bytes 0–3: LE Int32 = storage version (always 8 for .mcstructure)
    // Bytes 4–7: LE Int32 = NBT payload byte length (excluding the 8-byte header)
    // Source: 02_TECHNICAL_REFERENCE §1-1
    if (format === 'bedrock') {
      const headerView = new DataView(buffer, 0, 8);
      this._storageVersion = headerView.getInt32(0, true);  // LE
      this._payloadLength  = headerView.getInt32(4, true);  // LE

      // Validate: version should be 8 for .mcstructure
      if (this._storageVersion !== 8) {
        console.warn(
          `NBTReader: unexpected Bedrock storage version ${this._storageVersion} (expected 8). ` +
          'Continuing anyway — file may be a level.dat or future format.'
        );
      }

      // Slice off the header; all subsequent offsets are relative to byte 8
      this._buffer  = buffer.slice(8);
      this._payload = this._payloadLength; // informational
    } else {
      this._buffer = buffer;
    }

    this._view = new DataView(this._buffer);
  }

  // ── Low-level scalar readers ───────────────────────────────────────────────

  /** Read a signed 8-bit integer. Returns { value: number, next: number } */
  readByte(offset) {
    return { value: this._view.getInt8(offset), next: offset + 1 };
  }

  /** Read an unsigned 8-bit integer (for tag type IDs and boolean-as-byte). */
  readUByte(offset) {
    return { value: this._view.getUint8(offset), next: offset + 1 };
  }

  /** Read a signed 16-bit integer. */
  readShort(offset) {
    return { value: this._view.getInt16(offset, this.le), next: offset + 2 };
  }

  /** Read a signed 32-bit integer. */
  readInt(offset) {
    return { value: this._view.getInt32(offset, this.le), next: offset + 4 };
  }

  /**
   * Read a signed 64-bit integer as BigInt.
   * ⚠️ Must use BigInt — Number has only 53-bit precision.
   * Violating this silently corrupts Litematic LongArray data.
   */
  readLong(offset) {
    // getInt64 does not exist on DataView; read as two Int32s and combine.
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

  /** Read a 32-bit float. */
  readFloat(offset) {
    return { value: this._view.getFloat32(offset, this.le), next: offset + 4 };
  }

  /** Read a 64-bit double. */
  readDouble(offset) {
    return { value: this._view.getFloat64(offset, this.le), next: offset + 8 };
  }

  /**
   * Read a NBT string: uint16 length prefix (always BE in Java; LE in Bedrock),
   * followed by that many UTF-8 bytes.
   */
  readString(offset) {
    // String length prefix: always the same endianness as the file
    const len   = this._view.getUint16(offset, this.le);
    const bytes = new Uint8Array(this._buffer, offset + 2, len);
    const value = new TextDecoder('utf-8').decode(bytes);
    return { value, next: offset + 2 + len };
  }

  // ── TAG_*_Array readers (return typed arrays without copying) ──────────────

  /**
   * Read TAG_Byte_Array: int32 count prefix + raw bytes.
   * Returns a Uint8Array view (no copy) and next cursor.
   */
  readByteArray(offset) {
    const { value: count, next: start } = this.readInt(offset);
    const arr = new Uint8Array(this._buffer, start, count);
    return { value: arr, count, next: start + count };
  }

  /**
   * Read TAG_Int_Array: int32 count prefix + count × int32.
   * Returns an Int32Array view (no copy).
   */
  readIntArray(offset) {
    const { value: count, next: start } = this.readInt(offset);
    const arr = new Int32Array(this._buffer, start, count);
    return { value: arr, count, next: start + count * 4 };
  }

  /**
   * Read TAG_Long_Array: int32 count prefix + count × int64.
   * Returns a BigInt64Array view (no copy).
   * ⚠️ Critical for Litematic BlockStates — must be BigInt64Array.
   */
  readLongArray(offset) {
    const { value: count, next: start } = this.readInt(offset);
    const arr = new BigInt64Array(this._buffer, start, count);
    return { value: arr, count, next: start + count * 8 };
  }

  // ── Tag payload reader (dispatches by type ID) ────────────────────────────

  /**
   * Read the payload of a tag given its type ID.
   * Does NOT read the tag's type byte or name — only the payload.
   * For TAG_Compound and TAG_List, returns shallow metadata (not full tree).
   *
   * @param {number} typeId - TAG type constant
   * @param {number} offset - Byte offset to start reading payload
   * @returns {{ value: *, next: number }}
   */
  readPayload(typeId, offset) {
    switch (typeId) {
      case TAG.BYTE:        return this.readByte(offset);
      case TAG.SHORT:       return this.readShort(offset);
      case TAG.INT:         return this.readInt(offset);
      case TAG.LONG:        return this.readLong(offset);
      case TAG.FLOAT:       return this.readFloat(offset);
      case TAG.DOUBLE:      return this.readDouble(offset);
      case TAG.BYTE_ARRAY:  return this.readByteArray(offset);
      case TAG.STRING:      return this.readString(offset);
      case TAG.INT_ARRAY:   return this.readIntArray(offset);
      case TAG.LONG_ARRAY:  return this.readLongArray(offset);

      // For compound and list, return the START offset so callers can walk
      // them manually via walkCompound / walkList without materialising the tree.
      case TAG.COMPOUND:
        return { value: { __type: 'compound', offset }, next: this._skipCompound(offset) };
      case TAG.LIST:
        return { value: { __type: 'list', offset }, next: this._skipList(offset) };

      case TAG.END:
        return { value: null, next: offset };

      default:
        throw new RangeError(`NBTReader: unknown tag type ${typeId} at offset ${offset}`);
    }
  }

  // ── readTag: reads a full named tag (type + name + payload) ──────────────

  /**
   * Read a single named tag at `offset`.
   * Returns the parsed tag and the cursor position after this tag.
   *
   * @param {number} offset
   * @returns {{ typeId: number, name: string, value: *, next: number }}
   */
  readTag(offset) {
    const { value: typeId, next: afterType } = this.readUByte(offset);

    // TAG_End has no name or payload
    if (typeId === TAG.END) {
      return { typeId: TAG.END, name: '', value: null, next: afterType };
    }

    const { value: name, next: afterName } = this.readString(afterType);
    const { value, next }                  = this.readPayload(typeId, afterName);

    return { typeId, name, value, next };
  }

  // ── Generator: walkCompound ───────────────────────────────────────────────

  /**
   * Lazily iterate named tags inside a TAG_Compound without building a full object.
   * Yields each tag one at a time; stops at TAG_End.
   *
   * Usage (in Worker, section-by-section):
   *   for (const tag of reader.walkCompound(offset)) {
   *     if (tag.name === 'size') { ... }
   *   }
   *
   * @param {number} offset - Byte offset of the FIRST tag inside the compound
   *                          (i.e., after the compound's own type+name header).
   * @yields {{ typeId, name, value, next }}
   */
  *walkCompound(offset) {
    let cursor = offset;
    while (cursor < this._view.byteLength) {
      const tag = this.readTag(cursor);
      cursor = tag.next;
      if (tag.typeId === TAG.END) break;
      yield tag;
    }
  }

  /**
   * Read an entire TAG_Compound into a plain JS object.
   * Use ONLY for small, bounded compounds (e.g., a single block state's `states`).
   * NEVER call on the root compound of a large structure file.
   *
   * @param {number} offset
   * @returns {{ obj: object, next: number }}
   */
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

  // ── Generator: walkList ───────────────────────────────────────────────────

  /**
   * Lazily iterate entries inside a TAG_List.
   * Reads the element type byte and count int32, then yields each element.
   *
   * @param {number} offset - Byte offset of the list's payload (element type byte)
   * @yields {{ index: number, typeId: number, value: *, next: number }}
   */
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

  /**
   * Read a TAG_List into a plain JS array.
   * Use only for small, bounded lists (e.g., `size` = [SX, SY, SZ]).
   *
   * @param {number} offset
   * @returns {{ arr: Array, elemType: number, next: number }}
   */
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

  // ── Convenience: find a named tag inside a compound (linear scan) ─────────

  /**
   * Find and return the first tag with the given name inside a compound at `offset`.
   * Stops scanning as soon as the name is found — does not parse the rest.
   *
   * Useful for extracting a single known field (e.g., 'format_version') without
   * materialising the entire compound.
   *
   * @param {number} offset - First tag byte inside the compound
   * @param {string} name
   * @returns {{ typeId, name, value, next } | null}
   */
  findInCompound(offset, name) {
    for (const tag of this.walkCompound(offset)) {
      if (tag.name === name) return tag;
    }
    return null;
  }

  // ── Root entry point ──────────────────────────────────────────────────────

  /**
   * Read the root TAG_Compound of the file.
   * Returns a cursor positioned just inside the root compound's payload —
   * use walkCompound(cursor) to iterate top-level tags.
   *
   * For Bedrock .mcstructure, the root compound has an empty name ('').
   * For Java .nbt / .litematic, the root compound may have a name.
   *
   * @returns {{ name: string, bodyOffset: number }}
   */
  getRoot() {
    // Root tag: type byte (should be TAG_Compound = 10) + name string + payload start
    const { value: typeId, next: afterType } = this.readUByte(0);
    if (typeId !== TAG.COMPOUND) {
      throw new Error(
        `NBTReader: root tag is type ${typeId}, expected TAG_Compound (10). ` +
        'Possible causes: wrong format flag, unstripped GZip, or corrupted file.'
      );
    }
    const { value: name, next: bodyOffset } = this.readString(afterType);
    return { name, bodyOffset };
  }

  // ── Private skip helpers (advance cursor without materialising value) ──────

  /**
   * Skip over a TAG_Compound and return the cursor position after it.
   * Used internally by readPayload to advance past nested compounds
   * without building JS objects.
   */
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

  /**
   * Skip over a TAG_List and return the cursor position after it.
   */
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

  // ── Diagnostic helpers ────────────────────────────────────────────────────

  /** Total byte length of the NBT payload (after header strip). */
  get byteLength() {
    return this._buffer.byteLength;
  }

  /** Storage version from the Bedrock header (undefined for Java files). */
  get storageVersion() {
    return this._storageVersion;
  }
}
