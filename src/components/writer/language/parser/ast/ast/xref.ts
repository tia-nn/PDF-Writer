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
    splittedBy?: [string, string];  // [start と len の間 , 次のエントリまでの間]
}

export interface XRefEntryNode extends BaseASTNode {
    ctx: XrefEntryContext;
    v: {
        n: { src: IntegerNode, },
        g: { src: IntegerNode, },
        type: { src: XRefTypeNode, },
    };
    splittedBy?: [string, string, string];  // [n と g の間 , g と type の間 , 次のエントリまでの間]
}

export interface XRefTypeNode extends BaseASTNode {
    ctx: XrefTypeContext;
    v: { src: TerminalNode, value: "n" | "f", };
}
