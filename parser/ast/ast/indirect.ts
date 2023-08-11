import { TerminalNode } from "antlr4";
import { BaseASTNode, UnionTerminal, UnionNode, TermErrorType } from "./base";
import { IndirectObjectDefineContext, IndirectReferenceContext } from "../../antlr/dist/PDFParser";
import { ObjectNode } from "./object";
import { IntegerNode } from "./number";


export interface IndirectDefineNode extends BaseASTNode {
    ctx: IndirectObjectDefineContext;
    v: {
        objNum?: { src: IntegerNode, },
        genNum?: { src: IntegerNode, },
        kObj?: { src: TerminalNode, value: TermErrorType, },
        object?: { src: ObjectNode, },
        kEndobj?: { src: TerminalNode, value: TermErrorType, },
    };
}

export interface IndirectReferenceNode extends BaseASTNode {
    ctx: IndirectReferenceContext;
    v: {
        objNum?: { src: IntegerNode, },
        genNum?: { src: IntegerNode, },
        kR: { src: TerminalNode, value: TermErrorType, },
    };
}
