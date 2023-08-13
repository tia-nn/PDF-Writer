import { TerminalNode } from "antlr4";
import { BaseASTNode, UnionTerminal, UnionNode } from "./base";
import { NullObjContext } from "../../antlr/dist/PDFParser";

export interface NullObjectNode extends BaseASTNode {
    ctx: NullObjContext;
    v?: { src: TerminalNode, value: null, };
}
