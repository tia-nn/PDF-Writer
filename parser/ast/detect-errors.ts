import { ParserRuleContext, TerminalNode, Token } from "antlr4";
import { StartNode } from "../../src/components/Writer";
import { isMissingNode } from "./TerminalNodeWithErrorCheck";
import { BaseASTNode, ErrorReport } from "./ast/base";
import { Position } from "./ast/position";
import { XRefEntryNode, XRefSectionNode, XRefSubsectionHeaderNode, XRefSubsectionNode } from "./ast/xref";
import { TrailerNode } from "./ast/trailer";

export function detectErrorStart(node: StartNode): ErrorReport[] {
    const errors: ErrorReport[] = [];


    if (!node.v.header || node.v.header.value === "missing") {
        errors.push({ position: { line: 1, column: 0, start: 0, stop: 0, length: 0 }, message: "missing PDF Header." });
    }
    if (!node.v.body) errors.push({
        position: calcPositionBetween(node.v.header?.src, node.v.xref?.src || node.v.trailer?.src) || tokenToPosition(node.ctx.start),
        message: "missing PDF Body."
    });
    if (!node.v.xref) errors.push({
        position: calcPositionBetween(node.v.body?.src || node.v.header?.src, node.v.trailer?.src) || tokenToPosition(node.ctx.start),
        message: "missing Xref Table."
    }); else errors.push(...detectErrorXRef(node.v.xref.src));
    if (!node.v.trailer) errors.push({
        position: calcPositionTail(node.v.xref?.src || node.v.body?.src || node.v.header?.src) || tokenToPosition(node.ctx.start),
        message: "missing PDF Trailer."
    }); else errors.push(...detectErrorTrailer(node.v.trailer.src));

    return errors;
}

function detectErrorXRef(node: XRefSectionNode): ErrorReport[] {
    const errors: ErrorReport[] = [];

    if (!node.v.kXref || node.v.kXref.value === "missing") errors.push({
        position: calcPositionNodeHead(node) || node.position,
        message: "missing xref keyword.",
    });
    if (node.v.subsections.src.length < 1) errors.push({
        position: node.position,
        message: "xref table must have 1 or more subsections",
    }); else errors.push(...node.v.subsections.src.map(detectErrorXrefSubsection).flat(1));

    return errors;
}

function detectErrorXrefSubsection(node: XRefSubsectionNode, index: number): ErrorReport[] {
    const errors: ErrorReport[] = [];

    if (!node.v.header) errors.push({
        position: node.position,
        message: "missing xref subsection header.",
    });
    else
        errors.push(...detectErrorXrefSubsectionHeader(node.v.header.src, node.v.entries.src, index));

    errors.push(...node.v.entries.src.map(detectErrorXrefEntry).flat(1));

    return errors;
}

function detectErrorXrefSubsectionHeader(header: XRefSubsectionHeaderNode, entries: XRefEntryNode[], index: number) {
    const errors: ErrorReport[] = [];

    const isMissingStart = !header.v.start || !header.v.start.src.v || header.v.start.src.v.eType == "missing";
    const isMissingLen = !header.v.len || !header.v.len.src.v || header.v.len.src.v.eType == "missing";

    if (isMissingStart) errors.push({
        position: header.position,
        message: "missing object number of first object.",
    });
    if (isMissingLen) errors.push({
        position: header.position,
        message: "missing number of xref subsection entries.",
    });

    if (!isMissingStart && !isMissingLen) {
        const startValue = header.v.start!.src.v!.value;
        const lenValue = header.v.len!.src.v!.value;
        if (index === 0) {
            console.log(header.v.start);
            if (startValue !== 0) errors.push({
                position: header.position,
                message: "first xref subsection must have a entry which object number is 0.",
            });
        }

        if (lenValue !== entries.length) errors.push({
            position: header.v.len!.src.position,
            message: "mismatch number of xref subsection entries",
        });
        if (entries.length !== 0) {
            if (startValue !== (entries[0]).v.n.src.v?.value) errors.push({
                position: header.v.start!.src.position,
                message: "mismatch object number of first object",
            });
            if (index === 0 && entries[0].v.n.src.v?.value === 0 && entries[0].v.g.src.v?.value !== 65535) errors.push({
                position: entries[0].v.g.src.position,
                message: "generation number in the entry which object number is 0 must be 65535",
            });
        };

        // TODO: 固定フォーマット検証
        // TODO: 実際の定義との差異検証
    }

    return errors;
}

function detectErrorXrefEntry(node: XRefEntryNode) {
    const errors: ErrorReport[] = [];

    if (!node.v.n.src.is10Digits) errors.push({
        position: node.v.n.src.position,
        message: "object number must be 10-digits"
    });
    if (!node.v.g.src.is5Digits) errors.push({
        position: node.v.g.src.position,
        message: "generation number must be 5-digits"
    });

    // TODO: 固定フォーマット検証

    return errors;
}

function detectErrorTrailer(node: TrailerNode) {
    const errors: ErrorReport[] = [];

    if (!node.v.kTrailer) errors.push({
        position: calcPositionNodeHead(node) || node.position,
        message: "missing trailer keyword.",
    });
    if (!node.v.dict) errors.push({
        position: calcPositionBetween(node.v.kTrailer?.src, node.v.kStartxref?.src || node.v.xrefOffset?.src || node.v.eofMarker?.src) || node.position,
        message: "missing trailer dictionary",
    });
    if (!node.v.kStartxref) errors.push({
        position: calcPositionBetween(node.v.dict?.src || node.v.kTrailer?.src, node.v.xrefOffset?.src || node.v.eofMarker?.src) || node.position,
        message: "missing startxref keyword.",
    });
    if (!node.v.xrefOffset) errors.push({
        position: calcPositionBetween(node.v.kStartxref?.src || node.v.dict?.src || node.v.kTrailer?.src, node.v.eofMarker?.src) || node.position,
        message: "missing number of xref offset.",
    });
    if (!node.v.eofMarker) errors.push({
        position: calcPositionNodeTail(node) || node.position,
        message: "missing EOF marker.",
    });

    return errors;
}

function calcPositionBetween(node1: BaseASTNode | TerminalNode | undefined, node2: BaseASTNode | TerminalNode | undefined): Position | undefined {
    const pos1 = node1 instanceof TerminalNode ? calcPositionTerm(node1) : node1?.position;
    const pos2 = node2 instanceof TerminalNode ? calcPositionTerm(node2) : node2?.position;

    if (pos1 && pos2) {
        return {
            start: pos1.stop,
            stop: pos2.start,
            length: pos2.start - pos1.stop,
        };
    } else return undefined;
}

function calcPositionTail(node: BaseASTNode | TerminalNode | undefined): Position | undefined {
    return node instanceof TerminalNode ? calcPositionTermTail(node) : calcPositionNodeTail(node);
}

function calcPositionNodeHead(node?: BaseASTNode): Position | undefined {
    if (!node) return undefined;

    return {
        start: node.position.start,
        stop: node.position.start,
        length: 0,
    };
}

function calcPositionNodeTail(node?: BaseASTNode): Position | undefined {
    if (!node) return undefined;

    return {
        start: node.position.stop,
        stop: node.position.stop,
        length: 0,
    };
}

function calcPositionTermTail(term?: TerminalNode): Position | undefined {
    if (!term) return undefined;

    return {
        start: term.symbol.stop,
        stop: term.symbol.stop,
        length: 0,
    };
}

function calcPositionTerm(term?: TerminalNode): Position | undefined {
    if (!term) return undefined;

    return tokenToPosition(term.symbol);
}

function tokenToPosition(token: Token): Position {
    return {
        line: token.line,
        column: token.column,
        start: token.start,
        stop: token.stop + 1,
        length: token.stop - token.start + 1
    };
}
