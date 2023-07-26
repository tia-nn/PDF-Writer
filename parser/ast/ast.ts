import { ParserRuleContext, TerminalNode } from "antlr4";
import { Indirect_object_defineContext, IntegerContext, NameContext, Name_contentContext, ObjectContext, RealContext, Xref_headerContext, Xref_sectionContext, Xref_subsectionContext } from "../antlr/dist/PDFParser";


export type Position = {
    line: number;
    column: number;
    start: number;
    stop: number;
}


class BaseASTNode {
    ctx: ParserRuleContext;
    value: any;
    position: Position;

    constructor(ctx: ParserRuleContext) {
        this.ctx = ctx;
    }

    calcPosition(ctx: ParserRuleContext) {
        let first = ctx.getChild(0);
        while (!(first instanceof TerminalNode)) {
            first = (first as ParserRuleContext).getChild(0);
        }
        let last = ctx.getChild(ctx.getChildCount() - 1);
        while (!(last instanceof TerminalNode)) {
            last = (last as ParserRuleContext).getChild((last as ParserRuleContext).getChildCount() - 1);
        }

        return {
            line: first.symbol.line,
            column: first.symbol.column,
            start: first.symbol.start,
            stop: last.symbol.stop,
        }
    }
}

export class IntegerNode extends BaseASTNode {
    ctx: IntegerContext;
    src: TerminalNode;
    value: number;

    constructor(ctx: IntegerContext) {
        super(ctx);
        this.src = ctx.INTEGER();
        this.value = parseInt(this.src.getText());
        this.position = this.calcPosition(ctx);
    }
}

export class RealNode extends BaseASTNode {
    ctx: RealContext;
    src: TerminalNode;
    value: number;

    constructor(ctx: RealContext) {
        super(ctx);
        this.src = ctx.FLOAT();
        this.value = parseFloat(this.src.getText());
        this.position = this.calcPosition(ctx);
    }
}

const NameContentType = {
    ESCAPE: "escape",
    INVALID: "invalid",
    CONTENT: "content",
} as const;

export class NameContentNode extends BaseASTNode {
    ctx: Name_contentContext;
    type: typeof NameContentType[keyof typeof NameContentType];
    src: TerminalNode;
    value: string;

    constructor(ctx: Name_contentContext) {
        super(ctx);
        let src: TerminalNode
        if (src = ctx.NAME_ESCAPE()) {
            this.src = src;
            this.type = NameContentType.ESCAPE;
            this.value = String.fromCharCode(parseInt(src.getText().substring(1), 16))
        } else if (src = ctx.NAME_ESC_INVALID()) {
            this.src = src;
            this.type = NameContentType.INVALID;
            this.value = src.getText().substring(1);
        } else {
            this.src = ctx.NAME_CONTENT();
            this.type = NameContentType.CONTENT;
            this.value = this.src.getText();
        }
        this.position = this.calcPosition(ctx);
    }
}

export class NameNode extends BaseASTNode {
    ctx: NameContext;
    src: {
        namePrefix: TerminalNode,
        nameContents: Array<Name_contentContext>,
    };
    node: {
        nameContents: Array<NameContentNode>,
    }
    value: string;

    constructor(ctx: NameContext) {
        super(ctx);
        this.src = {
            namePrefix: ctx.NAME_PREFIX(),
            nameContents: ctx.name_content_list(),
        };
        this.node = {
            nameContents: this.src.nameContents.map(c => new NameContentNode(c)),
        }
        this.value = this.node.nameContents.reduce((p, c) => p + c.value, '');
        this.position = this.calcPosition(ctx);
    }
}

export class StringNode extends BaseASTNode {

}

export class IndirectObjectDefineNode extends BaseASTNode {
    ctx: Indirect_object_defineContext;
    src: {
        objectNumber: IntegerContext,
        generationNumber: IntegerContext,
        objKeyword: TerminalNode,
        object: ObjectContext,
        endobjKeyword: TerminalNode
    };
    node: {
        objectNumber: IntegerNode,
        generationNumber: IntegerNode,
        // object:,
    }
    value: {
        objectNumber: number,
        generationNumber: number,
        // object:,
    };

    constructor(ctx: Indirect_object_defineContext) {
        super(ctx);

        this.src = {
            objectNumber: ctx.integer(0),
            generationNumber: ctx.integer(1),
            objKeyword: ctx.K_OBJ(),
            object: ctx.object(),
            endobjKeyword: ctx.K_ENDOBJ(),
        }
        this.node = {
            objectNumber: new IntegerNode(this.src.objectNumber),
            generationNumber: new IntegerNode(this.src.generationNumber),
        }
        this.value = {
            objectNumber: this.node.objectNumber.value,
            generationNumber: this.node.generationNumber.value,
        }
        this.position = this.calcPosition(ctx);
    }
}

export class XRefSectionNode extends BaseASTNode {
    ctx: Xref_sectionContext;
    src: {
        xrefHeader: Xref_headerContext;
        xrefSubsections: Xref_subsectionContext[],
    };
    node: {
        xrefSubsections
    }
}

export type ASTNode = IntegerNode | IndirectObjectDefineNode;
