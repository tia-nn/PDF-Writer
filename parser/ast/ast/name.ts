import { TerminalNode } from "antlr4";
import { BaseASTNode, UnionTerminal } from "./base";
import { NameContext, Name_contentContext } from "../../antlr/dist/PDFParser";

export interface NameNode extends BaseASTNode {
    ctx: NameContext;
    src: {
        prefix?: TerminalNode,
        contents: NameContentNode[],
    };
    value?: string;
}

export interface NameContentNode extends BaseASTNode {
    ctx: Name_contentContext;
    src?: NameCKindEscape | NameCKindInvalid | NameCKindContent;
    value?: string;
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
