import { TerminalNode } from "antlr4";
import { BaseASTNode, UnionTerminal, UnionNode } from "./base";
import { StartContext } from "../../antlr/dist/PDFParser";
import { BodyNode } from "./doby";
import { XRefSectionNode } from "./xref";
import { TrailerNode } from "./trailer";


export interface StartNode extends BaseASTNode {
    ctx: StartContext;
    src: {
        header?: TerminalNode,
        body: BodyNode,
        xref?: XRefSectionNode,
        trailer?: TrailerNode,
    };
    value: {
        body: BodyNode['value'],
        xref?: XRefSectionNode['value'],
        trailer?: TrailerNode['value'],
    };
}
