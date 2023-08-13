import { IndirectDefineDetector } from "./parser/ast/IndirectDefineDetector";
import { StartNode } from "./parser/ast/ast/start";

export function buildXrefTable(ast: StartNode) {
    if (!ast.v.xref || !ast.v.xref.src.v.kXref || !ast.v.trailer || !ast.v.trailer.src.v.kTrailer) return undefined;

    const defines = new IndirectDefineDetector().detect(ast);

    // 定義の objNum, genNum, 位置を出す
    const defPos: Array<{ objectNumber: number, generationNumber: number, start: number; }> = [];
    for (let i = 0; i < defines.length; i++) {
        const d = defines[i];
        if (d.v.objNum != null && d.v.objNum.src.v) {
            defPos[d.v.objNum.src.v.value] = {
                objectNumber: d.v.objNum.src.v.value,
                generationNumber: d.v.genNum?.src.v?.value || 0,
                start: d.position.start,
            };
        }
    }

    // n エントリ
    const entries: Array<string | null> = [null];
    for (let i = 1; i < defPos.length; i++) {
        const d = defPos[i];
        if (d) {
            const entry = ('0000000000' + d.start.toString()).slice(-10)
                + ' ' + ('00000' + d.generationNumber.toString()).slice(-5)
                + ' ' + 'n' + ' \n';
            entries.push(entry);
        } else {
            entries.push(null);
        }
    }

    // f エントリ
    let i = 0;
    while (true) {
        if (entries[i] == null) {
            const _next = entries.slice(i + 1).findIndex(el => el == null);
            const next = _next != -1 ? _next + i + 1 : -1;
            const g = i == 0 ? "65535" : "00000";
            if (next != -1) {
                entries[i] = `${("0000000000" + next.toString()).slice(-10)} ${g} f \n`;
                i = next;
                continue;
            } else {
                entries[i] = `0000000000 ${g} f \n`;
                break;
            }
        }
        i++;
    }

    const section = `xref\n0 ${entries.length}\n` + entries.join('');

    const xrefStart = ast.v.xref.src.position.start;
    const trailerStart = ast.v.trailer?.src.v.kTrailer.src.symbol.start;

    return {
        start: xrefStart,
        end: trailerStart,
        text: section,
    };
}
