// Reads and sets the color range an AV1 stream carries in each sequence header (repeated in every key frame). Decoders
// take the range from there rather than from the MP4's boxes. It's a single bit, so it's set in place without changing
// the packet's size.

import { BitReader } from "./bitReader";

const OBU_SEQUENCE_HEADER = 1;

/** Reads an unsigned LEB128 number, returning it and the bytes it took. */
function leb128(data: Uint8Array, pos: number): [number, number] {
    let value = 0;
    for (let i = 0; i < 8; ++i) {
        const byte = data[pos + i];
        if (byte === undefined) throw new Error("The data ended early");
        value += (byte & 0x7f) * 2 ** (i * 7);
        if (!(byte & 0x80)) return [value, i + 1];
    }
    throw new Error("Bad LEB128 number");
}

/** Where each OBU's payload starts and how long it is, with its type. */
function* obus(packet: Uint8Array) {
    let pos = 0;
    while (pos < packet.length) {
        const header = packet[pos];
        const type = (header >> 3) & 15;
        const hasExtension = (header >> 2) & 1;
        const hasSize = (header >> 1) & 1;
        let start = pos + 1 + hasExtension;
        let size = packet.length - start;
        if (hasSize) {
            const [value, length] = leb128(packet, start);
            start += length;
            size = value;
        }
        yield { type, start, size };
        pos = start + size;
    }
}

/** Skips a uvlc() number. */
function skipUvlc(reader: BitReader) {
    let zeros = 0;
    while (zeros < 32 && !reader.bit()) ++zeros;
    if (zeros < 32) reader.bits(zeros);
}

/** Where color_range is in a sequence header starting at `start` bytes, in bits, or undefined if it has none. */
function sequenceRangeBit(packet: Uint8Array, start: number) {
    const reader = new BitReader(packet, start * 8);
    const profile = reader.bits(3);
    reader.bit(); // still_picture
    const reducedHeader = reader.bit();
    if (reducedHeader) {
        reader.bits(5); // seq_level_idx
    }
    else {
        let decoderModelInfo = 0;
        let bufferDelayLength = 0;
        if (reader.bit()) { // timing_info_present_flag
            reader.bits(64); // num_units_in_display_tick, time_scale
            if (reader.bit()) skipUvlc(reader); // equal_picture_interval, num_ticks_per_picture_minus_1
            decoderModelInfo = reader.bit();
            if (decoderModelInfo) {
                bufferDelayLength = reader.bits(5) + 1;
                reader.bits(32); // num_units_in_decoding_tick
                reader.bits(10); // buffer_removal_time_length_minus_1, frame_presentation_time_length_minus_1
            }
        }
        const initialDisplayDelay = reader.bit();
        const operatingPoints = reader.bits(5) + 1;
        for (let i = 0; i < operatingPoints; ++i) {
            reader.bits(12); // operating_point_idc
            if (reader.bits(5) > 7) reader.bit(); // seq_level_idx, seq_tier
            // decoder_buffer_delay, encoder_buffer_delay, low_delay_mode_flag
            if (decoderModelInfo && reader.bit()) reader.bits(bufferDelayLength * 2 + 1);
            if (initialDisplayDelay && reader.bit()) reader.bits(4); // initial_display_delay_minus_1
        }
    }
    const widthBits = reader.bits(4) + 1;
    const heightBits = reader.bits(4) + 1;
    reader.bits(widthBits + heightBits); // max_frame_width_minus_1, max_frame_height_minus_1
    if (!reducedHeader && reader.bit()) reader.bits(7); // frame_id_numbers_present_flag, frame id lengths
    reader.bits(3); // use_128x128_superblock, enable_filter_intra, enable_intra_edge_filter
    if (!reducedHeader) {
        reader.bits(4); // enable_interintra_compound, enable_masked_compound, enable_warped_motion, enable_dual_filter
        const orderHint = reader.bit();
        if (orderHint) reader.bits(2); // enable_jnt_comp, enable_ref_frame_mvs
        const screenContentTools = reader.bit() ? 2 : reader.bit(); // seq_choose_screen_content_tools, seq_force_screen_content_tools
        if (screenContentTools > 0 && !reader.bit()) reader.bit(); // seq_choose_integer_mv, seq_force_integer_mv
        if (orderHint) reader.bits(3); // order_hint_bits_minus_1
    }
    reader.bits(3); // enable_superres, enable_cdef, enable_restoration
    // color_config
    if (reader.bit() && profile === 2) reader.bit(); // high_bitdepth, twelve_bit
    const monochrome = profile === 1 ? 0 : reader.bit();
    let primaries = 2;
    let transfer = 2;
    let matrix = 2;
    if (reader.bit()) { // color_description_present_flag
        primaries = reader.bits(8);
        transfer = reader.bits(8);
        matrix = reader.bits(8);
    }
    // BT.709 primaries, sRGB transfer and identity matrix are always full range
    if (!monochrome && primaries === 1 && transfer === 13 && matrix === 0) return undefined;
    return reader.position;
}

/** Where the color range bits are in a packet, in bits. */
function rangeBits(packet: Uint8Array) {
    const bits: number[] = [];
    for (const obu of obus(packet)) {
        if (obu.type === OBU_SEQUENCE_HEADER) {
            const bit = sequenceRangeBit(packet, obu.start);
            if (bit !== undefined) bits.push(bit);
        }
    }
    return bits;
}

/** Whether a packet's stream says it's full range, or undefined if the packet doesn't say. */
export function readAv1Range(packet: Uint8Array) {
    try {
        const bit = rangeBits(packet)[0];
        return bit === undefined ? undefined : ((packet[bit >> 3] >> (7 - (bit & 7))) & 1) === 1;
    }
    catch (err) {
        console.error("Couldn't read the video's color range", err);
        return undefined;
    }
}

/** Sets the range wherever the packet says it, in place. */
export function setAv1Range(packet: Uint8Array, fullRange: boolean) {
    try {
        for (const bit of rangeBits(packet)) {
            const mask = 1 << (7 - (bit & 7));
            packet[bit >> 3] = fullRange ? packet[bit >> 3] | mask : packet[bit >> 3] & ~mask;
        }
    }
    catch (err) {
        console.error("Couldn't set the video's color range", err);
    }
}
