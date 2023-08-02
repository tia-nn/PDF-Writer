import { StartContext } from "../../../../parser/antlr/dist/PDFParser";
import { StartNode } from "../../../../parser/ast/ast/start";
import { DetectIndirectDefines } from "../../../../parser/ast/detect-indirect-define";


export function buildXrefTable(tree: StartContext, ast: StartNode) {
    const defines = new DetectIndirectDefines().visit(tree);

    const defPos: Array<{ objectNumber: number, generationNumber: number, start: number; }> = [];
    for (let i = 0; i < defines.length; i++) {
        const d = defines[i];
        if (d.value.objNum != null) {
            defPos[d.value.objNum] = {
                objectNumber: d.value.objNum,
                generationNumber: d.value.genNum || 0,
                start: d.position.start,
            };
        }
    }

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


    const xrefStart = ast.src.xref?.position.start;
    const trailerStart = ast.src.trailer?.src.k_trailer.symbol.start;

    return {
        start: xrefStart,
        end: trailerStart,
        text: section,
    };
}
