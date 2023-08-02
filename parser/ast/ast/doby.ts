import { TerminalNode } from "antlr4";
import { BaseASTNode, UnionTerminal, UnionNode } from "./base";
import { BodyContext } from "../../antlr/dist/PDFParser";
import { IndirectDefineNode } from "./indirect";


export interface BodyNode extends BaseASTNode {
    ctx: BodyContext;
    src: IndirectDefineNode[],
    value: IndirectDefineNode['value'][];
}
