import { ParseTree, ParserRuleContext, RecognitionException, TerminalNode } from "antlr4";
import { Position } from "./position";

export type SrcNode = TerminalNode | BaseASTNode | UnionNode | UnionTerminal;
export type SrcNodeArr = SrcNode | SrcNode[];
export type NodeSrc = SrcNodeArr | Record<string, SrcNodeArr | Record<string, SrcNodeArr>>;

type SrcValue = { src: NodeSrc, value?: any, };

export type TermErrorType = "valid" | "missing";

export interface BaseASTNode {
    _kind: "baseastnode";
    ctx: ParserRuleContext;
    position: Position;
    exception?: RecognitionException;
    errors?: ErrorReport[];

    v?: SrcValue | Record<string, SrcValue | undefined>;
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
