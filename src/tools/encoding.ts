
// encodeUTF16BEA( 'aあ' ) => [ 0x61, 0x30, 0x42 ]
// decodeUTF16BEA( [ 0x61, 0x30, 0x42 ] ) => 'a0B'
// encodeUTF16BEA( 'a0B' ) => [ 0x61, 0x30, 0x42 ]
//
// decodeUTF16BEA( [ 0x61, 0x80, 0x00 ] ) => 'a耀'
// encodeUTF16BEA( 'a耀' ) => [ 0x61, 0x80, 0x00 ]
//

/**
 * Ascii 文字は Ascii(1-byte) 、非 Ascii 文字を UTF-16BE でエンコードする
 * encodeUTF16BEA は非可逆なことに注意する
 */
export function encodeUTF16BEA(s: string) {
    const u16 = toUint16Array(s);
    const u8 = new Uint8Array(u16.byteLength);
    let i8 = 0
    for (let i16 = 0; i16 < u16.length; i16++) {
        if (u16[i16] >= 0x80) {
            u8[i8++] = u16[i16] >>> 8;
        }
        u8[i8++] = u16[i16] & 0xff;
    }
    return u8.subarray(0, i8);
}

/**
 * Ascii 範囲内の byte はそのまま、Ascii 範囲外の byte は次の byte と合わせて UTF-16BE としてデコードする。
 * ただし、CR (\x0d) は非 Ascii 文字として変換する
 *
 * encodeUTF16BEA(decodeUTF16BEA(buf)) はもとの buf に戻る
 */
export function decodeUTF16BEA(buf: ArrayBufferLike) {
    const u8 = new Uint8Array(buf);
    const u16 = new Uint16Array(u8.length);
    let i16 = 0;
    let i8 = 0
    for (; i8 < u8.length;) {
        if (u8[i8] >= 0x80 || u8[i8] === 0x0d) { // CR はエディタに LF にされてしまうため、0x0d 非Ascii文字として変換する
            u16[i16++] = (u8[i8++] << 8) | u8[i8++];
        } else {
            u16[i16++] = u8[i8++];
        }
    }

    return String.fromCharCode.apply(null, u16.subarray(0, i16) as any);
}

export function encodeStream(s: string) {

}

export function encodeTextString(s: string) {
    if (isAscii(s)) {
        return new TextEncoder().encode(s);
    }
    if (isValidUTF16(s)) {
        return encodeUTF16BEwBOM(s);
    }
    return toUint16Array(s);
}

function encodeUTF16BEwBOM(str: string) {
    const ret = new Uint16Array(str.length + 1);
    ret[0] = 0xfeff; // BOM
    for (let i = 0; i < str.length; i++) {
        ret[i + 1] = str.charCodeAt(i);
    }
    return ret;
};

function isAscii(c: string) {
    for (let i = 0; i < c.length; i++) {
        if (c.charCodeAt(i) >= 0x80) return false;
    }
    return true;
}

function isValidUTF16(str: string) {
    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);

        // 高サロゲート（リードサロゲート）の場合
        if (0xD800 <= code && code <= 0xDBFF) {
            const nextCode = str.charCodeAt(i + 1);

            // 次が低サロゲートでなければ無効
            if (!(0xDC00 <= nextCode && nextCode <= 0xDFFF)) {
                return false;
            }
            i++; // サロゲートペアを1文字と数えるためインクリメント
        }
        // 低サロゲートが単独で出現した場合も無効
        else if (0xDC00 <= code && code <= 0xDFFF) {
            return false;
        }
    }
    return true;
}

/**
 * https://ja.wikipedia.org/wiki/Ascii85
 */
export function Ascii85Encode(arr: Uint8Array) {
    const len = Math.ceil(arr.length / 4);
    const remainder = arr.length % 4;
    const buf = new ArrayBuffer(len * 4);
    new Uint8Array(buf).set(arr);
    const view = new DataView(buf);

    let r = '';
    for (let i = 0; i < len - 1; i++) {
        let N = view.getUint32(i * 4);
        if (N === 0) {
            r += 'z';
            continue;
        }
        const n1 = Math.floor(N / (85 ** 4));
        N -= n1 * (85 ** 4);
        const n2 = Math.floor(N / (85 ** 3));
        N -= n2 * (85 ** 3);
        const n3 = Math.floor(N / (85 ** 2));
        N -= n3 * (85 ** 2);
        const n4 = Math.floor(N / (85));
        N -= n4 * (85);
        const n5 = N % 85;
        r += String.fromCharCode(n1 + 33, n2 + 33, n3 + 33, n4 + 33, n5 + 33);
    }

    let N = view.getUint32((len - 1) * 4);
    const n1 = Math.floor(N / (85 ** 4));
    N -= n1 * (85 ** 4);
    const n2 = Math.floor(N / (85 ** 3));
    N -= n2 * (85 ** 3);
    const n3 = Math.floor(N / (85 ** 2));
    N -= n3 * (85 ** 2);
    const n4 = Math.floor(N / (85));
    const n5 = N % 85;

    if (remainder === 0) {
        if (N === 0) r += 'z';
        else r += String.fromCharCode(n1 + 33, n2 + 33, n3 + 33, n4 + 33, n5 + 33);
    } else if (remainder === 1) {
        r += String.fromCharCode(n1 + 33, n2 + 33);
    } else if (remainder === 2) {
        r += String.fromCharCode(n1 + 33, n2 + 33, n3 + 33);
    } else if (remainder === 3) {
        r += String.fromCharCode(n1 + 33, n2 + 33, n3 + 33, n4 + 33);
    }

    return r + '~>';
}

function toUint16Array(s: string) {
    const a = [].map.call(s, function (c: string) {
        return c.charCodeAt(0)
    }) as number[];
    return (new Uint16Array(a));
}
