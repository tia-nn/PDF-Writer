import { TerminalNode } from "antlr4";
import { BaseASTNode, UnionTerminal, UnionNode } from "./base";
import { StreamContext, Stream_mainContext } from "../../antlr/dist/PDFParser";
import { DictNode } from "./dict";

export interface StreamNode extends BaseASTNode {
    ctx: StreamContext;
    src: {
        dict?: DictNode,
        main?: StreamMainNode,
    };
    value: {
        dict: DictNode['value'],
        content: string,
    };
}

export interface StreamMainNode extends BaseASTNode {
    ctx: Stream_mainContext;
    src: {
        k_stream?: TerminalNode,
        content_endstream?: TerminalNode,
        // k_endstream: TerminalNode,
    };
    value: string;
}
