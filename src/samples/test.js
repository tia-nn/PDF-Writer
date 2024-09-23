import { encodeUTF16BEA, decodeUTF16BEA } from "../tools/encoding";
import { readFileSync } from "fs";

function toArrayBuffer(buffer) {
    var ab = new ArrayBuffer(buffer.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
        view[i] = buffer[i];
    }
    return ab;
}

const f = readFileSync("./src/samples/150x150.jpg");

const ff = new Uint8Array(toArrayBuffer(f));

const a = (decodeUTF16BEA(ff));
const b = encodeUTF16BEA(a);

for (let i = 0; i < ff.length; i++) {
    if (ff[i] !== b[i]) {
        console.log(i, ff[i], b[i]);
    }
}
