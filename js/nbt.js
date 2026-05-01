/**
 * Minecraft Bedrock Edition (Little Endian) NBT Parser
 */
export class NBTParser {
    constructor(buffer) {
        this.view = new DataView(buffer);
        this.offset = 0;
    }

    parse() {
        const type = this.readByte();
        if (type === 0) return null; // TAG_End
        const name = this.readString();
        return { name, value: this.readTag(type) };
    }

    readTag(type) {
        switch (type) {
            case 1: return this.readByte();    // TAG_Byte
            case 2: return this.readShort();   // TAG_Short
            case 3: return this.readInt();     // TAG_Int
            case 4: return this.readLong();    // TAG_Long
            case 5: return this.readFloat();   // TAG_Float
            case 6: return this.readDouble();  // TAG_Double
            case 7: return this.readByteArray(); // TAG_Byte_Array
            case 8: return this.readString();    // TAG_String
            case 9: return this.readList();      // TAG_List
            case 10: return this.readCompound(); // TAG_Compound
            case 11: return this.readIntArray();  // TAG_Int_Array
            default: throw new Error(`Unknown NBT Tag: ${type} at offset ${this.offset}`);
        }
    }

    readByte() {
        const val = this.view.getInt8(this.offset);
        this.offset += 1;
        return val;
    }

    readShort() {
        const val = this.view.getInt16(this.offset, true); // Little Endian
        this.offset += 2;
        return val;
    }

    readInt() {
        const val = this.view.getInt32(this.offset, true); // Little Endian
        this.offset += 4;
        return val;
    }

    readLong() {
        const val = this.view.getBigInt64(this.offset, true); // Little Endian
        this.offset += 8;
        return Number(val); // Simplification for counts
    }

    readFloat() {
        const val = this.view.getFloat32(this.offset, true);
        this.offset += 4;
        return val;
    }

    readDouble() {
        const val = this.view.getFloat64(this.offset, true);
        this.offset += 8;
        return val;
    }

    readByteArray() {
        const length = this.readInt();
        const array = new Int8Array(this.view.buffer, this.offset, length);
        this.offset += length;
        return Array.from(array);
    }

    readString() {
        const length = this.readShort();
        if (length === 0) return "";
        const bytes = new Uint8Array(this.view.buffer, this.offset, length);
        const decoder = new TextDecoder();
        const str = decoder.decode(bytes);
        this.offset += length;
        return str;
    }

    readList() {
        const type = this.readByte();
        const length = this.readInt();
        const list = [];
        for (let i = 0; i < length; i++) {
            list.push(this.readTag(type));
        }
        return list;
    }

    readCompound() {
        const obj = {};
        while (true) {
            const type = this.readByte();
            if (type === 0) break; // TAG_End
            const name = this.readString();
            obj[name] = this.readTag(type);
        }
        return obj;
    }

    readIntArray() {
        const length = this.readInt();
        const array = [];
        for (let i = 0; i < length; i++) {
            array.push(this.readInt());
        }
        return array;
    }
}
