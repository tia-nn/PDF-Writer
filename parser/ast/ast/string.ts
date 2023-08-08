import { TerminalNode } from "antlr4";
import { BaseASTNode, UnionTerminal, UnionNode } from "./base";
import { Literal_stringContext, Literal_string_contentContext, StringContext, Escape_sequenceContext, Hex_stringContext, Hex_string_contentContext, Literal_string_innerContext } from "../../antlr/dist/PDFParser";

export interface StringNode extends BaseASTNode {
    ctx: StringContext,
    src?: StringKindLiteral | StringKindHex;
    value?: string;
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
    ctx: Literal_stringContext | Literal_string_innerContext;
    src: {
        LStrQuoteOpen?: TerminalNode,
        LStrContents: LStrContentNode[],
        LStrQuoteClose?: TerminalNode,
    };
    value?: string;
}

export interface LStrContentNode extends BaseASTNode {
    ctx: Literal_string_contentContext;
    src?: LStrContentKindEscape | LStrContentKindLStr | LStrContentKindInvalid | LStrContentKindContent;
    value?: string;
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
    kind: "invalid_escape";
}

export interface LStrContentKindContent extends UnionTerminal {
    kind: "content";
}

export interface LStrEscapeNode extends BaseASTNode {
    ctx: Escape_sequenceContext;
    src?: LStrEscKindChar | LStrEscKindOctal | LStrEscKindNewline;
    value?: string;
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
    ctx: Hex_stringContext;
    src: {
        HStrQuoteOpen?: TerminalNode,
        HStrContents: HStrContentNode[],
        HStrQuoteClose?: TerminalNode,
    };
    value?: string;
}

export interface HStrContentNode extends BaseASTNode {
    ctx: Hex_string_contentContext;
    src?: HStrContentKindContent | HStrContentKindInvalid;
    value?: string;
}

export interface HStrContentKindContent extends UnionTerminal {
    kind: "content";
}

export interface HStrContentKindInvalid extends UnionTerminal {
    kind: "invalid";
}
