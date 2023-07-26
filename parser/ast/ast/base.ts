import { ParseTree, ParserRuleContext, RecognitionException, TerminalNode } from "antlr4";
import { Position } from "./position";

type SrcNode = ParseTree | BaseASTNode | UnionNode;
export type NodeSrc = SrcNode | SrcNode[] | Record<string, SrcNode | SrcNode[]>;

export interface BaseASTNode {
    ctx: ParserRuleContext;
    src?: NodeSrc;
    value: any | Record<string, any>;
    position: Position;
    exception?: RecognitionException;
}

export interface UnionNode {
    kind: string,
    node: NodeSrc;
}

export interface UnionTerminal extends UnionNode {
    node: TerminalNode;
}
