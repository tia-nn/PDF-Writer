import { ErrorNode, ParserRuleContext, TerminalNode } from "antlr4";
import { ArrayContext, Escape_sequenceContext, Hex_stringContext, Hex_string_contentContext, IntegerContext, Literal_stringContext, Literal_string_contentContext, Literal_string_innerContext, NameContext, Name_contentContext, Null_objContext, NumberContext, RealContext, StringContext } from "../../antlr/dist/PDFParser";
import PDFParserVisitor from "../../antlr/dist/PDFParserVisitor";
import { BaseASTNode, UnionNode, UnionTerminal } from "./base";
import { Position } from "./position";
import { IntegerNode, NumberKindInteger, NumberKindReal, NumberNode, RealNode } from "./number";
import { NameCKindContent, NameCKindEscape, NameCKindInvalid, NameContentNode, NameNode } from "./name";
import { HStrContentNode, HStringNode, LStrContentNode, LStrEscapeNode, LStringNode, StringKindHex, StringKindLiteral, StringNode } from "./string";
import { NullObjectNode } from "./null";

export class ASTVisitor extends PDFParserVisitor<BaseASTNode> {

    // Number

    visitNumber: ((ctx: NumberContext) => NumberNode) = ctx => {
        if (ctx.exception) return this.errorNode(ctx, 0);

        const integer = ctx.integer();
        const real = ctx.real();
        const src: NumberNode['src'] = integer ? {
            kind: "integer",
            node: integer.accept(this),
        } as NumberKindInteger : {
            kind: "real",
            node: real.accept(this),
        } as NumberKindReal;
        return {
            ctx: ctx,
            src: src,
            value: src.node.value,
            position: calcPosition(ctx),
        };
    };

    visitInteger: ((ctx: IntegerContext) => IntegerNode) = ctx => {
        if (ctx.exception) return this.errorNode(ctx, 0);

        const src = ctx.INTEGER();
        const valueStr = src.getText();
        return {
            ctx: ctx,
            position: calcPosition(ctx),
            src: src,
            value: parseInt(valueStr),
            is10Digits: valueStr.length === 10,
            is5Digits: valueStr.length === 5,
        };
    };

    visitReal: ((ctx: RealContext) => RealNode) = ctx => {
        if (ctx.exception) return this.errorNode(ctx, 0);

        const src = ctx.FLOAT();
        const valueStr = src.getText();
        return {
            ctx: ctx,
            position: calcPosition(ctx),
            src: src,
            value: parseFloat(valueStr),
        };
    };

    // Name

    visitName: ((ctx: NameContext) => NameNode) = ctx => {
        if (ctx.exception) return this.errorNode(ctx, '');

        const contents = ctx.name_content_list().map(n => n.accept(this) as NameContentNode);
        return {
            ctx: ctx,
            position: calcPosition(ctx),
            src: {
                prefix: ctx.NAME_PREFIX(),
                contents: contents,
            },
            value: contents.reduce((p, v) => p + v.value, "")
        };
    };

    visitName_content: ((ctx: Name_contentContext) => NameContentNode) = ctx => {
        if (ctx.exception) return this.errorNode(ctx, '');

        const esc = ctx.NAME_ESCAPE();
        const inv = ctx.NAME_ESC_INVALID();
        const content = ctx.NAME_CONTENT();
        let src: NameContentNode["src"];
        let value: string;
        if (esc) {
            src = {
                kind: "escape",
                node: esc,
            };
            value = String.fromCharCode(parseInt(esc.getText().substring(1)));
        } else if (inv) {
            src = {
                kind: "invalid",
                node: inv,
            };
            value = inv.getText();
        } else {
            src = {
                kind: "content",
                node: content,
            };
            value = content.getText();
        }
        return {
            ctx: ctx,
            src: src,
            value: value,
            position: calcPosition(ctx),
        };
    };

    // String

    visitString: ((ctx: StringContext) => StringNode) = ctx => {
        if (ctx.exception) return this.errorNode(ctx, "");

        const literal = ctx.literal_string();
        const hex = ctx.hex_string();
        const src: StringNode['src'] = literal ? {
            kind: "literal",
            node: literal.accept(this),
        } as StringKindLiteral : {
            kind: "hex",
            node: hex.accept(this),
        } as StringKindHex;
        return {
            ctx: ctx,
            src: src,
            value: src.node.value,
            position: calcPosition(ctx),
        };
    };

    visitLiteral_string: ((ctx: Literal_stringContext) => LStringNode) = ctx => {
        if (ctx.exception) return this.errorNode(ctx, '');

        const contents = ctx.literal_string_content_list().map(n => n.accept(this) as LStrContentNode);
        return {
            ctx: ctx,
            position: calcPosition(ctx),
            src: {
                LStrQuoteOpen: ctx.LSTR_QUOTE_OPEN(),
                LStrContents: contents,
                LStrQuoteClose: ctx.LSTR_QUOTE_CLOSE(),
            },
            value: contents.reduce((p, v) => p + v.value, "")
        };
    };

    visitLiteral_string_content: ((ctx: Literal_string_contentContext) => LStrContentNode) = ctx => {
        if (ctx.exception) return this.errorNode(ctx, '');

        const escape = ctx.escape_sequence();
        const str = ctx.literal_string_inner();
        const inv = ctx.INVALID_ESCAPE();
        const content = ctx.LSTR_CONTENT();

        let src: LStrContentNode['src'];
        let value: string;
        if (escape) {
            src = {
                kind: "escape",
                node: escape.accept(this) as LStrEscapeNode
            };
            value = src.node.value;
        } else if (str) {
            src = {
                kind: "lstr",
                node: str.accept(this) as LStringNode,
            };
            value = '(' + src.node.value + ')';
        } else if (inv) {
            src = {
                kind: "invalid_escape",
                node: inv
            };
            value = src.node.getText().substring(1);
        } else {
            src = {
                kind: "content",
                node: content
            };
            value = content.getText();
        }
        return {
            ctx: ctx,
            position: calcPosition(ctx),
            src: src,
            value: value,
        };
    };

    visitLiteral_string_inner: ((ctx: Literal_string_innerContext) => LStringNode) = ctx => {
        if (ctx.exception) return this.errorNode(ctx, '');

        const contents = ctx.literal_string_content_list().map(n => n.accept(this) as LStrContentNode);
        return {
            ctx: ctx,
            position: calcPosition(ctx),
            src: {
                LStrQuoteOpen: ctx.LSTR_QUOTE_OPEN_INNER(),
                LStrContents: contents,
                LStrQuoteClose: ctx.LSTR_QUOTE_CLOSE(),
            },
            value: contents.reduce((p, v) => p + v.value, "")
        };
    };

    visitEscape_sequence: ((ctx: Escape_sequenceContext) => LStrEscapeNode) = ctx => {
        if (ctx.exception) return this.errorNode(ctx, '');

        const char = ctx.ESCAPE_CHAR();
        const octal = ctx.ESCAPE_OCTAL();
        const newline = ctx.ESCAPE_NEWLINE();
        let src: LStrEscapeNode['src'];
        let value: string;
        if (char) {
            src = {
                kind: "char",
                node: char
            };
            const t = char.getText().substring(1);
            switch (t) {
                case 'n':
                    value = '\n';
                    break;
                case 'r':
                    value = "\r";
                    break;
                case 't':
                    value = '\t';
                    break;
                case 'b':
                    value = '\b';
                    break;
                case 'f':
                    value = '\f';
                    break;
                default:
                    value = t;
            }
        } else if (octal) {
            src = {
                kind: "octal",
                node: octal,
            };
            value = String.fromCharCode(parseInt(octal.getText().substring(1), 8));
        } else {
            src = {
                kind: "newline",
                node: newline,
            };
            value = '';
        }
        return {
            ctx: ctx,
            position: calcPosition(ctx),
            src: src,
            value: value,
        };
    };

    visitHex_string: ((ctx: Hex_stringContext) => HStringNode) = ctx => {
        if (ctx.exception) return this.errorNode(ctx, '');

        const contents = ctx.hex_string_content_list().map(n => n.accept(this) as HStrContentNode);
        return {
            ctx: ctx,
            position: calcPosition(ctx),
            src: {
                HStrQuoteOpen: ctx.HSTR_QUOTE_OPEN(),
                HStrContents: contents,
                HStrQuoteClose: ctx.HSTR_QUOTE_CLOSE(),
            },
            value: contents.reduce((p, v) => p + v.value, "")
        };
    };

    visitHex_string_content: ((ctx: Hex_string_contentContext) => HStrContentNode) = ctx => {
        if (ctx.exception) return this.errorNode(ctx, '');

        const content = ctx.HSTR_CONTENT();
        const invalid = ctx.HSTR_INVALID();
        let src: HStrContentNode['src'];
        let value: string;
        if (content) {
            src = {
                kind: "content",
                node: content
            };
            value = split2(content.getText()).reduce((v, s) => v + String.fromCharCode(parseInt(s, 16)), "");
        } else {
            src = {
                kind: "invalid",
                node: invalid,
            };
            value = '';
        }
        return {
            ctx: ctx,
            position: calcPosition(ctx),
            src: src,
            value: value,
        };
    };

    // null

    visitNull_obj: ((ctx: Null_objContext) => NullObjectNode) = ctx => {
        if (ctx.exception) return this.errorNode(ctx, null);

        return {
            ctx: ctx,
            position: calcPosition(ctx),
            src: ctx.K_NULL(),
            value: null,
        };
    };

    // Error

    errorNode<RET extends BaseASTNode>(ctx: RET["ctx"], defaultValue: RET['value']): RET {
        return {
            ctx: ctx,
            position: calcPosition(ctx),
            value: defaultValue,
            exception: ctx.exception,
        } as RET;
    }
}

function calcPosition(ctx: ParserRuleContext): Position {
    if (ctx.getChildCount() == 0) {
        return {
            line: ctx.start.line,
            column: ctx.start.column,
            start: ctx.start.start,
            stop: ctx.start.stop,
            length: ctx.start.stop - ctx.start.start + 1
        };
    }
    let last = ctx.getChild(ctx.getChildCount() - 1);
    while (!(last instanceof TerminalNode)) {
        last = (last as ParserRuleContext).getChild((last as ParserRuleContext).getChildCount() - 1);
    }

    return {
        line: ctx.start.line,
        column: ctx.start.column,
        start: ctx.start.start,
        stop: last.symbol.stop,
        length: last.symbol.stop - ctx.start.start + 1
    };
}

function split2(s: string) {
    const result: string[] = [];
    for (let i = 0; i < s.length; i += 2) {
        result.push(s.substring(i, i + 2));
    }
    return result;
}
