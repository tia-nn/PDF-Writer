import { ParserRuleContext, TerminalNode } from "antlr4";
import { Indirect_object_defineContext, IntegerContext } from "../antlr/dist/PDFParser";
import { ASTVisitor } from "./ast-visitor";


type Position = {
    line: number;
    column: number;
    start: number;
    stop: number;
}


class BaseASTNode {
    value: any;
    position: Position;
}

export class IntegerNode extends BaseASTNode {
    token: TerminalNode;
    value: number;

    constructor(ctx: IntegerContext) {
        super();
        this.token = ctx.INTEGER();
        this.value = parseInt(this.token.getText());
        this.position = {
            line: this.token.symbol.line,
            column: this.token.symbol.column,
            start: this.token.symbol.start,
            stop: this.token.symbol.stop,
        }
    }
}

export class IndirectObjectDefineNode extends BaseASTNode {
    ctx: Indirect_object_defineContext;
    tokens: {
        objectNumber: IntegerNode,
        generationNumber: IntegerNode,
    };
    value: {
        objectNumber: IntegerContext,
        generationNumber: IntegerContext,
    };

    constructor(ctx: Indirect_object_defineContext) {
        super();
        this.ctx = ctx;

        this.tokens = {
            objectNumber: new IntegerNode(ctx.integer(0)),
            generationNumber: new IntegerNode(ctx.integer(1)),
        }
        this.position = {
            line: this.tokens.objectNumber.token.symbol.line,
            column: this.tokens.objectNumber.token.symbol.column,
            start: this.tokens.objectNumber.token.symbol.start,
            stop: ctx.K_ENDOBJ().symbol.stop,
        }
    }
}


export type ASTNode = IntegerNode | IndirectObjectDefineNode;
