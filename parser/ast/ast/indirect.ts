import { TerminalNode } from "antlr4";
import { BaseASTNode, UnionTerminal, UnionNode } from "./base";
import { Indirect_object_defineContext, Indirect_referenceContext } from "../../antlr/dist/PDFParser";
import { ObjectNode } from "./object";
import { IntegerNode } from "./number";


export interface IndirectDefineNode extends BaseASTNode {
    ctx: Indirect_object_defineContext;
    src?: {
        objNum?: IntegerNode,
        genNum?: IntegerNode,
        k_obj: TerminalNode,
        object?: ObjectNode,
        k_endobj: TerminalNode,
    };
    value: {
        objNum?: number,
        genNum?: number,
        obj?: ObjectNode['value'],
    };
}

export interface IndirectReferenceNode extends BaseASTNode {
    ctx: Indirect_referenceContext;
    src?: {
        objNum?: IntegerNode,
        genNum?: IntegerNode,
        k_r: TerminalNode,
    };
    value: {
        objNum?: number,
        genNum?: number,
    };
}
