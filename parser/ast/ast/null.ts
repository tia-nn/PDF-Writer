import { TerminalNode } from "antlr4";
import { BaseASTNode, UnionTerminal, UnionNode } from "./base";
import { Null_objContext } from "../../antlr/dist/PDFParser";

export interface NullObjectNode extends BaseASTNode {
    ctx: Null_objContext;
    src?: TerminalNode,
    value?: null;
}
