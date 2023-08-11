import { TerminalNode } from "antlr4";
import { BaseASTNode, UnionTerminal, UnionNode, TermErrorType } from "./base";
import { StreamContext, StreamMainContext } from "../../antlr/dist/PDFParser";
import { DictNode } from "./dict";

export interface StreamNode extends BaseASTNode {
    ctx: StreamContext;
    v: {
        dict?: { src: DictNode, },
        main: { src: StreamMainNode, value: string, },
    };
}

export interface StreamMainNode extends BaseASTNode {
    ctx: StreamMainContext;
    v: {
        kStream: { src: TerminalNode, },
        contentKEndStream?: { src: TerminalNode, value: TermErrorType, },
    };
}
