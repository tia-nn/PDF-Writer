import { TerminalNode } from "antlr4";
import { BaseASTNode, UnionTerminal, UnionNode, TermErrorType } from "./base";
import { TrailerContext } from "../../antlr/dist/PDFParser";
import { DictNode } from "./dict";
import { IntegerNode } from "./number";

export interface TrailerNode extends BaseASTNode {
    ctx: TrailerContext;
    v: {
        kTrailer?: { src: TerminalNode, value: TermErrorType, },
        dict?: { src: DictNode, },
        kStartxref?: { src: TerminalNode, value: TermErrorType, },
        xrefOffset?: { src: IntegerNode, },
        eofMarker?: { src: TerminalNode, value: TermErrorType, },
    };
}
