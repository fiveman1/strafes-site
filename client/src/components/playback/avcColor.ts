// Writes an H.264 stream's color space into its sequence parameter set (SPS).
// Some encoders put it only in the MP4's colr box, but many players read only the stream and guess without it. Others
// write their own, which can say full range when the frames were squeezed into TV range (see TV_RANGE_ALPHA in
// videoRecorder.ts), so an existing one is rewritten too.

/** H.264 VUI code points, as in the MP4 colr box. 2 is unspecified. */
const PRIMARIES: Record<string, number> = { "bt709": 1, "bt470bg": 5, "smpte170m": 6 };
const TRANSFER: Record<string, number> = { "bt709": 1, "smpte170m": 6, "linear": 8, "iec61966-2-1": 13 };
const MATRIX: Record<string, number> = { "rgb": 0, "bt709": 1, "bt470bg": 5, "smpte170m": 6 };
const UNSPECIFIED = 2;

/** Profiles whose SPS carries chroma format, bit depths and scaling lists. */
const HIGH_PROFILES = new Set([100, 110, 122, 244, 44, 83, 86, 118, 128, 138, 139, 134, 135]);

class BitReader {
    private pos = 0;
    constructor(private bytes: Uint8Array) {}
    get position() {
        return this.pos;
    }
    bit() {
        if (this.pos >= this.bytes.length * 8) throw new Error("SPS ended early");
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

class BitWriter {
    private out: number[] = [];
    private current = 0;
    private count = 0;
    bit(bit: number) {
        this.current = (this.current << 1) | bit;
        if (++this.count === 8) {
            this.out.push(this.current);
            this.current = 0;
            this.count = 0;
        }
    }
    bits(value: number, count: number) {
        for (let i = count - 1; i >= 0; --i) this.bit((value >> i) & 1);
    }
    /** rbsp_trailing_bits: a one, then zeros to the byte */
    finish() {
        this.bit(1);
        while (this.count !== 0) this.bit(0);
        return this.out;
    }
}

function unescapeRbsp(nal: Uint8Array) {
    const out: number[] = [];
    let zeros = 0;
    for (const byte of nal) {
        if (zeros >= 2 && byte === 3) {
            zeros = 0;
            continue;
        }
        out.push(byte);
        zeros = byte === 0 ? zeros + 1 : 0;
    }
    return new Uint8Array(out);
}

function escapeRbsp(rbsp: number[]) {
    const out: number[] = [];
    let zeros = 0;
    for (const byte of rbsp) {
        if (zeros >= 2 && byte <= 3) {
            out.push(3);
            zeros = 0;
        }
        out.push(byte);
        zeros = byte === 0 ? zeros + 1 : 0;
    }
    return out;
}

function skipScalingList(reader: BitReader, size: number) {
    let last = 8;
    let next = 8;
    for (let i = 0; i < size; ++i) {
        if (next !== 0) next = (last + reader.se() + 256) % 256;
        last = next === 0 ? last : next;
    }
}

/** Where vui_parameters_present_flag is in the SPS's RBSP (after the NAL header byte), in bits. */
function findVuiFlag(rbsp: Uint8Array) {
    const reader = new BitReader(rbsp);
    const profile = reader.bits(8);
    reader.bits(16); // constraint flags, level
    reader.ue(); // seq_parameter_set_id
    if (HIGH_PROFILES.has(profile)) {
        const chromaFormat = reader.ue();
        if (chromaFormat === 3) reader.bit();
        reader.ue();
        reader.ue();
        reader.bit();
        if (reader.bit()) {
            for (let i = 0; i < (chromaFormat === 3 ? 12 : 8); ++i) {
                if (reader.bit()) skipScalingList(reader, i < 6 ? 16 : 64);
            }
        }
    }
    reader.ue(); // log2_max_frame_num_minus4
    const pocType = reader.ue();
    if (pocType === 0) {
        reader.ue();
    }
    else if (pocType === 1) {
        reader.bit();
        reader.se();
        reader.se();
        const cycle = reader.ue();
        for (let i = 0; i < cycle; ++i) reader.se();
    }
    reader.ue(); // max_num_ref_frames
    reader.bit();
    reader.ue(); // width
    reader.ue(); // height
    if (!reader.bit()) reader.bit(); // frame_mbs_only_flag, mb_adaptive_frame_field_flag
    reader.bit(); // direct_8x8_inference_flag
    if (reader.bit()) {
        reader.ue();
        reader.ue();
        reader.ue();
        reader.ue();
    }
    return reader.position;
}

/** Where the RBSP's stop bit (the last one bit) is, in bits. */
function stopBitPosition(rbsp: Uint8Array) {
    let last = rbsp.length - 1;
    while (last >= 0 && rbsp[last] === 0) --last;
    if (last < 0) throw new Error("SPS has no stop bit");
    let bit = 7;
    while (((rbsp[last] >> (7 - bit)) & 1) === 0) --bit;
    return last * 8 + bit;
}

/** video_signal_type: the range, then the color description. */
function writeSignalType(writer: BitWriter, videoFormat: number, colorSpace: VideoColorSpaceInit) {
    writer.bit(1); // video_signal_type_present_flag
    writer.bits(videoFormat, 3);
    writer.bit(colorSpace.fullRange ? 1 : 0);
    writer.bit(1); // colour_description_present_flag
    writer.bits(PRIMARIES[colorSpace.primaries ?? ""] ?? UNSPECIFIED, 8);
    writer.bits(TRANSFER[colorSpace.transfer ?? ""] ?? UNSPECIFIED, 8);
    writer.bits(MATRIX[colorSpace.matrix ?? ""] ?? UNSPECIFIED, 8);
}

/** The SPS NAL with the color space in its VUI, adding a VUI if it has none. */
function withColorVui(sps: Uint8Array, colorSpace: VideoColorSpaceInit) {
    const rbsp = unescapeRbsp(sps.subarray(1));
    const vuiFlag = findVuiFlag(rbsp);
    const end = stopBitPosition(rbsp);
    const reader = new BitReader(rbsp);
    const writer = new BitWriter();
    const copy = (count: number) => {
        const value = reader.bits(count);
        writer.bits(value, count);
        return value;
    };
    for (let i = 0; i < vuiFlag; ++i) writer.bit(reader.bit());
    writer.bit(1); // vui_parameters_present_flag
    if (reader.bit()) {
        if (copy(1) && copy(8) === 255) copy(32); // aspect ratio, 255 = width and height follow
        if (copy(1)) copy(1); // overscan
        let videoFormat = 5; // unspecified
        if (reader.bit()) {
            videoFormat = reader.bits(3);
            reader.bit(); // video_full_range_flag
            if (reader.bit()) reader.bits(24); // primaries, transfer, matrix
        }
        writeSignalType(writer, videoFormat, colorSpace);
        // chroma location, timing, HRD and the rest, unchanged
        while (reader.position < end) writer.bit(reader.bit());
    }
    else {
        writer.bit(0); // aspect_ratio_info_present_flag
        writer.bit(0); // overscan_info_present_flag
        writeSignalType(writer, 5, colorSpace);
        writer.bit(0); // chroma_loc_info_present_flag
        writer.bit(0); // timing_info_present_flag
        writer.bit(0); // nal_hrd_parameters_present_flag
        writer.bit(0); // vcl_hrd_parameters_present_flag
        writer.bit(0); // pic_struct_present_flag
        writer.bit(0); // bitstream_restriction_flag
    }
    return new Uint8Array([sps[0], ...escapeRbsp(writer.finish())]);
}

function toBytes(source: AllowSharedBufferSource) {
    return ArrayBuffer.isView(source)
        ? new Uint8Array(source.buffer, source.byteOffset, source.byteLength)
        : new Uint8Array(source);
}

/**
 * An avcC (AVCDecoderConfigurationRecord) whose SPSs carry the color space, or undefined if the record doesn't parse.
 */
export function avcConfigWithColor(description: AllowSharedBufferSource, colorSpace: VideoColorSpaceInit) {
    try {
        const config = toBytes(description);
        const out: number[] = Array.from(config.subarray(0, 5));
        const spsCount = config[5] & 0x1f;
        out.push(config[5]);
        let pos = 6;
        for (let i = 0; i < spsCount; ++i) {
            const length = (config[pos] << 8) | config[pos + 1];
            const sps = withColorVui(config.subarray(pos + 2, pos + 2 + length), colorSpace);
            out.push(sps.length >> 8, sps.length & 0xff, ...sps);
            pos += 2 + length;
        }
        // the PPSs and the High profile extension, unchanged
        out.push(...config.subarray(pos));
        return new Uint8Array(out);
    }
    catch (err) {
        console.error("Couldn't add the color space to the video's SPS", err);
        return undefined;
    }
}
