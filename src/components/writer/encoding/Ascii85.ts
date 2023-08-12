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
