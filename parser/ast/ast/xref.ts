import { TerminalNode } from "antlr4";
import { BaseASTNode, UnionTerminal, UnionNode } from "./base";
import { Xref_entryContext, Xref_sectionContext, Xref_subsectionContext, Xref_subsection_headerContext, Xref_typeContext } from "../../antlr/dist/PDFParser";
import { IntegerNode } from "./number";

export interface XRefSectionNode extends BaseASTNode {
    ctx: Xref_sectionContext;
    src: {
        k_xref?: TerminalNode,
        subsections: XRefSubsectionNode[],
    };
    value: XRefSubsectionNode['value'][];
}

export interface XRefSubsectionNode extends BaseASTNode {
    ctx: Xref_subsectionContext;
    src: {
        header?: XRefSubsectionHeaderNode,
        entries: XRefEntryNode[],
    };
    value: {
        header?: XRefSubsectionHeaderNode['value'],
        entries: XRefEntryNode['value'][],
    };
}

export interface XRefSubsectionHeaderNode extends BaseASTNode {
    ctx: Xref_subsection_headerContext;
    src: {
        start?: IntegerNode,
        len?: IntegerNode,
    };
    value: {
        start?: number,
        len?: number,
    };
}

export interface XRefEntryNode extends BaseASTNode {
    ctx: Xref_entryContext;
    src: {
        n?: IntegerNode,
        g?: IntegerNode,
        type?: XRefTypeNode,
    };
    value: {
        n?: number,
        g?: number,
        type?: XRefTypeNode['value'],
    };
}

export interface XRefTypeNode extends BaseASTNode {
    ctx: Xref_typeContext;
    src?: TerminalNode;
    value?: "n" | "f";
}
