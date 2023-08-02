import { TerminalNode } from "antlr4";
import { BaseASTNode, UnionTerminal, UnionNode } from "./base";
import { TrailerContext } from "../../antlr/dist/PDFParser";
import { DictNode } from "./dict";
import { IntegerNode } from "./number";

export interface TrailerNode extends BaseASTNode {
    ctx: TrailerContext;
    src: {
        k_trailer: TerminalNode,
        dict?: DictNode,
        k_startxref?: TerminalNode,
        xrefOffset?: IntegerNode,
        eofMarker?: TerminalNode,
    };
    value: {
        dict?: DictNode['value'],
        xrefOffset?: number,
    };
}
