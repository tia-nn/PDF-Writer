import { TerminalNode } from "antlr4";
import { IntegerContext, NumberContext, RealContext } from "../../antlr/dist/PDFParser";
import { BaseASTNode, UnionNode } from "./base";

export interface NumberNode extends BaseASTNode {
    ctx: NumberContext;
    src?: NumberKindInteger | NumberKindReal;
    value: number;
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
    src?: TerminalNode;
    value: number;
    is10Digits?: boolean;
    is5Digits?: boolean;
}

export interface RealNode extends BaseASTNode {
    ctx: RealContext;
    src?: TerminalNode;
    value: number;
}
