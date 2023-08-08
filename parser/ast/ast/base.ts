import { ParseTree, ParserRuleContext, RecognitionException, TerminalNode } from "antlr4";
import { Position } from "./position";

export type SrcNode = TerminalNode | BaseASTNode | UnionNode | UnionTerminal;
export type NodeSrc = SrcNode | SrcNode[] | Record<string, SrcNode | SrcNode[]>;

export interface BaseASTNode {
    _kind: "baseastnode";
    ctx: ParserRuleContext;
    src?: NodeSrc;
    value?: any | Record<string, any>;
    position: Position;
    exception?: RecognitionException;
    errors?: ErrorReport[];
}

export interface UnionNode {
    _kind: "unionnode";
    kind: string;
    node: BaseASTNode;
}

export interface UnionTerminal {
    _kind: "unionterminal";
    kind: string;
    node: TerminalNode;
}

export interface ErrorReport {
    position: Position;
    message: string;
}
