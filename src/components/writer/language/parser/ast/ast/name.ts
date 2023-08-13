import { TerminalNode, TokenStreamRewriter } from "antlr4";
import { BaseASTNode, TermErrorType, UnionTerminal } from "./base";
import { NameContext, NameContentContext } from "../../antlr/dist/PDFParser";

export interface NameNode extends BaseASTNode {
    ctx: NameContext;
    v: {
        prefix: { src: TerminalNode, },
        contents: { src: NameContentNode[], value: string; },
    };
}

export interface NameContentNode extends BaseASTNode {
    ctx: NameContentContext;
    v: {
        src: NameCKindEscape | NameCKindInvalid | NameCKindContent,
        value: string,
    };
}

export interface NameCKindEscape extends UnionTerminal {
    kind: "escape";
}

export interface NameCKindInvalid extends UnionTerminal {
    kind: "invalid";
}

export interface NameCKindContent extends UnionTerminal {
    kind: "content";
}
