/** Reads big-endian bits, as video bitstreams store them. */
export class BitReader {
    /** `pos` is where to start, in bits */
    constructor(private bytes: Uint8Array, private pos = 0) {}
    get position() {
        return this.pos;
    }
    bit() {
        if (this.pos >= this.bytes.length * 8) throw new Error("The data ended early");
        const bit = (this.bytes[this.pos >> 3] >> (7 - (this.pos & 7))) & 1;
        ++this.pos;
        return bit;
    }
    bits(count: number) {
        let value = 0;
        for (let i = 0; i < count; ++i) value = value * 2 + this.bit();
        return value;
    }
    ue() {
        let zeros = 0;
        while (this.bit() === 0) ++zeros;
        return 2 ** zeros - 1 + this.bits(zeros);
    }
    se() {
        const k = this.ue();
        return k & 1 ? (k + 1) / 2 : -k / 2;
    }
}
