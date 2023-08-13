import { TerminalNode } from "antlr4";
import { BaseASTNode, UnionTerminal, UnionNode, TermErrorType } from "./base";
import { LiteralStringContext, LiteralStringContentContext, StringContext, EscapeSequenceContext, HexStringContext, HexStringContentContext, LiteralStringInnerContext } from "../../antlr/dist/PDFParser";

export interface StringNode extends BaseASTNode {
    ctx: StringContext,
    v: { src: StringKindLiteral | StringKindHex, value: string, };
}

export interface StringKindLiteral extends UnionNode {
    kind: "literal",
    node: LStringNode,
}

export interface StringKindHex extends UnionNode {
    kind: "hex",
    node: HStringNode,
}

// - - - - -

export interface LStringNode extends BaseASTNode {
    ctx: LiteralStringContext | LiteralStringInnerContext;
    v: {
        LStrQuoteOpen: { src: TerminalNode, },
        LStrContents: { src: LStrContentNode[], value: string, },
        LStrQuoteClose?: { src: TerminalNode, value: TermErrorType, },
    };
}

export interface LStrContentNode extends BaseASTNode {
    ctx: LiteralStringContentContext;
    v: { src: LStrContentKindEscape | LStrContentKindLStr | LStrContentKindInvalid | LStrContentKindContent, value: string, };
}

export interface LStrContentKindEscape extends UnionNode {
    kind: "escape",
    node: LStrEscapeNode,
}

export interface LStrContentKindLStr extends UnionNode {
    kind: "lstr",
    node: LStringNode,
}

export interface LStrContentKindInvalid extends UnionTerminal {
    kind: "invalidEscape";
}

export interface LStrContentKindContent extends UnionTerminal {
    kind: "content";
}

export interface LStrEscapeNode extends BaseASTNode {
    ctx: EscapeSequenceContext;
    v: { src: LStrEscKindChar | LStrEscKindOctal | LStrEscKindNewline, value: string, };
}

export interface LStrEscKindChar extends UnionTerminal {
    kind: "char";
}

export interface LStrEscKindOctal extends UnionTerminal {
    kind: "octal";
}

export interface LStrEscKindNewline extends UnionTerminal {
    kind: "newline";
}

// - - - - -

export interface HStringNode extends BaseASTNode {
    ctx: HexStringContext;
    v: {
        HStrQuoteOpen: { src: TerminalNode, },
        HStrContents: { src: HStrContentNode[], value: string, },
        HStrQuoteClose?: { src: TerminalNode, value: TermErrorType, },
    };
}

export interface HStrContentNode extends BaseASTNode {
    ctx: HexStringContentContext;
    v: { src: HStrContentKindContent | HStrContentKindInvalid, value: string, };
}

export interface HStrContentKindContent extends UnionTerminal {
    kind: "content";
}

export interface HStrContentKindInvalid extends UnionTerminal {
    kind: "invalid";
}
