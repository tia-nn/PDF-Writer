
import { BaseASTNode, UnionTerminal, UnionNode, TermErrorType } from "./base";
import { StartContext } from "../../antlr/dist/PDFParser";
import { BodyNode } from "./doby";
import { XRefSectionNode } from "./xref";
import { TrailerNode } from "./trailer";
import { TerminalNode } from "antlr4";

export interface StartNode extends BaseASTNode {
    ctx: StartContext;
    v: {
        header?: { src: TerminalNode, value: TermErrorType, },
        body?: { src: BodyNode, },
        xref?: { src: XRefSectionNode, },
        trailer?: { src: TrailerNode, },
    };
}
