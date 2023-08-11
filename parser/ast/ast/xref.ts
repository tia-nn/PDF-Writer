import { TerminalNode } from "antlr4";
import { BaseASTNode, UnionTerminal, UnionNode, TermErrorType } from "./base";
import { XrefEntryContext, XrefSectionContext, XrefSubsectionContext, XrefSubsectionHeaderContext, XrefTypeContext } from "../../antlr/dist/PDFParser";
import { IntegerNode } from "./number";

export interface XRefSectionNode extends BaseASTNode {
    ctx: XrefSectionContext;
    v: {
        kXref?: { src: TerminalNode, value: TermErrorType, },
        subsections: { src: XRefSubsectionNode[], },
    };
}

export interface XRefSubsectionNode extends BaseASTNode {
    ctx: XrefSubsectionContext;
    v: {
        header?: { src: XRefSubsectionHeaderNode, },
        entries: { src: XRefEntryNode[], },
    };
}

export interface XRefSubsectionHeaderNode extends BaseASTNode {
    ctx: XrefSubsectionHeaderContext;
    v: {
        start?: { src: IntegerNode, },
        len?: { src: IntegerNode, },
    };
}

export interface XRefEntryNode extends BaseASTNode {
    ctx: XrefEntryContext;
    v: {
        n: { src: IntegerNode, },
        g: { src: IntegerNode, },
        type: { src: XRefTypeNode, },
    };
}

export interface XRefTypeNode extends BaseASTNode {
    ctx: XrefTypeContext;
    v: { src: TerminalNode, value: "n" | "f", };
}
