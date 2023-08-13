import { TerminalNode } from "antlr4";
import { IntegerContext, NumberContext, RealContext } from "../../antlr/dist/PDFParser";
import { BaseASTNode, TermErrorType, UnionNode } from "./base";

export interface NumberNode extends BaseASTNode {
    ctx: NumberContext;
    v: { src: NumberKindInteger | NumberKindReal, value: number, };
}

export interface NumberKindInteger extends UnionNode {
    kind: "integer",
    node: IntegerNode;
}

export interface NumberKindReal extends UnionNode {
    kind: "real",
    node: RealNode;
}

export interface IntegerNode extends BaseASTNode {
    ctx: IntegerContext;
    v?: { src: TerminalNode, value: number, eType: TermErrorType, };
    is10Digits: boolean;
    is5Digits: boolean;
}

export interface RealNode extends BaseASTNode {
    ctx: RealContext;
    v: { src: TerminalNode, value: number, };
}
