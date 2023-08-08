import { ParserRuleContext, TerminalNode, Token } from "antlr4";
import { StartNode } from "../../src/components/Writer";
import { isMissingNode } from "./TerminalNodeWithErrorCheck";
import { BaseASTNode, ErrorReport } from "./ast/base";
import { Position } from "./ast/position";
import { XRefSectionNode, XRefSubsectionHeaderNode, XRefSubsectionNode } from "./ast/xref";
import { TrailerNode } from "./ast/trailer";

export function detectErrorStart(node: StartNode): ErrorReport[] {
    const errors: ErrorReport[] = [];

    if (!node.src.header || isMissingNode(node.src.header)) {
        errors.push({ position: { line: 1, column: 0, start: 0, stop: 0, length: 0 }, message: "missing PDF Header." });
    }
    if (!node.src.body) errors.push({
        position: calcPositionBetweenTermNode(node.src.header, node.src.xref) || calcPositionBetweenTermNode(node.src.header, node.src.trailer) || tokenToPosition(node.ctx.start),
        message: "missing PDF Body."
    });
    if (!node.src.xref) errors.push({
        position: calcPositionBetweenNode(node.src.body, node.src.trailer) || calcPositionBetweenTermNode(node.src.header, node.src.trailer) || tokenToPosition(node.ctx.start),
        message: "missing Xref Table."
    }); else errors.push(...detectErrorXRef(node.src.xref));
    if (!node.src.trailer) errors.push({
        position: calcPositionNodeTail(node.src.xref) || calcPositionNodeTail(node.src.body) || tokenToPosition(node.ctx.start),
        message: "missing PDF Trailer."
    }); else errors.push(...detectErrorTrailer(node.src.trailer));

    return errors;
}

function detectErrorXRef(node: XRefSectionNode): ErrorReport[] {
    const errors: ErrorReport[] = [];

    if (!node.src.k_xref || isMissingNode(node.src.k_xref)) errors.push({
        position: calcPositionTerm(node.src.k_xref) || calcPositionNodeHead(node) || node.position,
        message: "missing xref keyword.",
    });
    if (node.src.subsections.length < 1) errors.push({
        position: node.position,
        message: "xref table must have 1 or more subsections",
    }); else errors.push(...node.src.subsections.map(detectErrorXrefSubsection).flat(1));

    return errors;
}

function detectErrorXrefSubsection(node: XRefSubsectionNode, index: number): ErrorReport[] {
    const errors: ErrorReport[] = [];

    if (!node.src.header) errors.push({
        position: node.position,
        message: "missing xref subsection header.",
    });
    else {
        errors.push(...detectErrorXrefSubsectionHeader(node.src.header));

        if (node.src.header.value.start != undefined && node.src.header.value.len != undefined) {
            if (node.src.header.value.len !== node.value.entries.length) errors.push({
                position: node.src.header.src.len!.position,
                message: "mismatch number of xref subsection entries",
            });
            if (node.value.entries.length !== 0 && node.src.header.value.start !== (node.value.entries[0]).n) errors.push({
                position: node.src.header.src.start!.position,
                message: "mismatch object number of first object",
            });
            if (index === 0) {
                console.log(node.src.header.value.start);
                if (node.src.header.value.start !== 0) errors.push({
                    position: node.src.header.position,
                    message: "first xref subsection must have object which object number is 0.",
                });
            }
        }
    }

    return errors;
}

function detectErrorXrefSubsectionHeader(node: XRefSubsectionHeaderNode) {
    const errors: ErrorReport[] = [];

    if (node.src.start == undefined) errors.push({
        position: node.position,
        message: "missing object number of first object.",
    });
    if (node.src.len == undefined) errors.push({
        position: node.position,
        message: "missing number of xref subsection entries.",
    });

    if (node.src.start != undefined && node.src.len != undefined) {
        // TODO: 固定フォーマット検証
    }

    return errors;
}

function detectErrorTrailer(node: TrailerNode) {
    const errors: ErrorReport[] = [];

    if (!node.src.k_trailer) errors.push({
        position: calcPositionNodeHead(node) || node.position,
        message: "missing trailer keyword.",
    });
    if (!node.src.dict) errors.push({
        position: calcPositionBetweenTerm(node.src.k_trailer, node.src.k_startxref) || node.position,
        message: "missing trailer dictionary",
    });
    if (!node.src.k_startxref) errors.push({
        position: calcPositionBetweenNode(node.src.dict, node.src.xrefOffset) || node.position,
        message: "missing startxref keyword.",
    });
    if (!node.src.xrefOffset) errors.push({
        position: calcPositionBetweenTerm(node.src.k_startxref, node.src.eofMarker) || node.position,
        message: "missing number of xref offset.",
    });
    if (!node.src.eofMarker) errors.push({
        position: calcPositionNodeTail(node) || node.position,
        message: "missing EOF marker.",
    });

    return errors;
}

function calcPositionBetweenNode(node1?: BaseASTNode, node2?: BaseASTNode): Position | undefined {
    if (!node1 || !node2) return undefined;

    return {
        start: node1.position.stop,
        stop: node2.position.start,
        length: node2.position.start - node1.position.stop,
    };
}

function calcPositionBetweenTermNode(term?: TerminalNode, node?: BaseASTNode): Position | undefined {
    if (!term || !node) return undefined;

    return {
        start: term.symbol.stop,
        stop: node.position.start,
        length: node.position.start - term.symbol.stop,
    };
}

function calcPositionBetweenNodeTerm(node?: BaseASTNode, term?: TerminalNode): Position | undefined {
    if (!node || !term) return undefined;

    return {
        start: node.position.stop + 1,
        stop: term.symbol.start,
        length: term.symbol.start - node.position.stop + 1
    };
}

function calcPositionBetweenTerm(term1?: TerminalNode, term2?: TerminalNode): Position | undefined {
    if (!term1 || !term2) return undefined;

    return {
        start: term1.symbol.stop + 1,
        stop: term2.symbol.start,
        length: term2.symbol.start - term1.symbol.stop + 1
    };
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

function cropString(src: string, start: number, end: number) {
    return src.substring(start, end);
}
