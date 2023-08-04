import { ParserRuleContext, TerminalNode } from "antlr4";
import { ArrayContext, BodyContext, DictContext, Dict_pairContext, Escape_sequenceContext, Hex_stringContext, Hex_string_contentContext, Indirect_object_defineContext, Indirect_referenceContext, IntegerContext, Literal_stringContext, Literal_string_contentContext, Literal_string_innerContext, NameContext, Name_contentContext, Null_objContext, NumberContext, ObjectContext, RealContext, StartContext, StreamContext, Stream_mainContext, StringContext, TrailerContext, Xref_entryContext, Xref_sectionContext, Xref_subsectionContext, Xref_subsection_headerContext, Xref_typeContext } from "../antlr/dist/PDFParser";
import PDFParserVisitor from "../antlr/dist/PDFParserVisitor";
import { BaseASTNode, ErrorReport } from "./ast/base";
import { Position } from "./ast/position";
import { IntegerNode, NumberKindInteger, NumberKindReal, NumberNode, RealNode } from "./ast/number";
import { NameContentNode, NameNode } from "./ast/name";
import { HStrContentNode, HStringNode, LStrContentNode, LStrEscapeNode, LStringNode, StringKindHex, StringKindLiteral, StringNode } from "./ast/string";
import { NullObjectNode } from "./ast/null";
import { ObjKindArray, ObjKindDict, ObjKindIndirectReference, ObjKindName, ObjKindNull, ObjKindNumber, ObjKindStream, ObjKindString, ObjectNode } from "./ast/object";
import { ArrayNode } from "./ast/array";
import { IndirectDefineNode, IndirectReferenceNode } from "./ast/indirect";
import { DictNode, DictPairNode } from "./ast/dict";
import { StreamMainNode, StreamNode } from "./ast/stream";
import { XRefEntryNode, XRefSectionNode, XRefSubsectionHeaderNode, XRefSubsectionNode, XRefTypeNode } from "./ast/xref";
import { TrailerNode } from "./ast/trailer";
import { BodyNode } from "./ast/doby";
import { StartNode } from "./ast/start";

export class ASTVisitor extends PDFParserVisitor<BaseASTNode> {

    visitStart: ((ctx: StartContext) => StartNode) = ctx => {
        const errors: ErrorReport[] = [];
        console.log(ctx);
        if (ctx.exception) return this.errorNode(ctx, { body: [] });

        const header = ctx.H_PDF();
        const body = ctx.body().accept(this) as BodyNode;
        const xref = ctx.xref_section()?.accept(this) as XRefSectionNode | undefined;
        const trailer = ctx.trailer()?.accept(this) as TrailerNode | undefined;

        if (!header) {
            errors.push({
                position: calcPositionStart(ctx),
                message: "missing PDF Header.",
            });
        }
        if (!xref) {
            errors.push({
                position: calcPositionStart(ctx),
                message: "missing xref table.",
            });
        }

        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            src: {
                header: header,
                body: body,
                xref: xref,
                trailer: trailer,
            },
            value: {
                body: body.value,
                xref: xref?.value,
                trailer: trailer?.value,
            }
        };
    };

    visitBody: ((ctx: BodyContext) => BodyNode) = ctx => {
        if (ctx.exception) return this.errorNode(ctx, []);

        const d = ctx.indirect_object_define_list().map(n => n.accept(this) as IndirectDefineNode);
        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            src: d,
            value: d.map(n => n.value),
        };
    };

    visitIndirect_object_define: ((ctx: Indirect_object_defineContext) => IndirectDefineNode) = ctx => {
        if (ctx.exception) return this.errorNode(ctx, { objNum: -1, genNum: -1, obj: null });


        const objNum = ctx.integer(0)?.accept(this) as IntegerNode | undefined;
        const genNum = ctx.integer(1)?.accept(this) as IntegerNode | undefined;
        const obj = ctx.object()?.accept(this) as ObjectNode | undefined;
        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            src: {
                objNum: objNum,
                genNum: genNum,
                k_obj: ctx.K_OBJ(),
                object: obj,
                k_endobj: ctx.K_ENDOBJ(),
            },
            value: {
                objNum: objNum?.value,
                genNum: genNum?.value,
                obj: obj?.value,
            },
        };
    };

    visitObject: ((ctx: ObjectContext) => ObjectNode) = ctx => {
        if (ctx.exception) return this.errorNode(ctx, null);

        const indirect = ctx.indirect_reference();
        const stream = ctx.stream();
        const dict = ctx.dict();
        const array = ctx.array();
        const name = ctx.name();
        const number = ctx.number_();
        const string = ctx.string_();
        const null_ = ctx.null_obj();
        const src: ObjectNode['src'] = indirect ? {
            _kind: "unionnode",
            kind: "reference",
            node: indirect.accept(this),
        } as ObjKindIndirectReference : stream ? {
            _kind: "unionnode",
            kind: "stream",
            node: stream.accept(this),
        } as ObjKindStream : dict ? {
            _kind: "unionnode",
            kind: "dict",
            node: dict.accept(this),
        } as ObjKindDict : array ? {
            _kind: "unionnode",
            kind: "array",
            node: array.accept(this),
        } as ObjKindArray : name ? {
            _kind: "unionnode",
            kind: "name",
            node: name.accept(this),
        } as ObjKindName : number ? {
            _kind: "unionnode",
            kind: "number",
            node: number.accept(this),
        } as ObjKindNumber : string ? {
            _kind: "unionnode",
            kind: "string",
            node: string.accept(this),
        } as ObjKindString : {
            _kind: "unionnode",
            kind: "null",
            node: null_.accept(this),
        } as ObjKindNull;
        return {
            _kind: "baseastnode",
            ctx: ctx,
            src: src,
            value: src.node.value,
            position: calcPosition(ctx),
        };
    };

    // Number

    visitNumber: ((ctx: NumberContext) => NumberNode) = ctx => {
        if (ctx.exception) return this.errorNode(ctx, 0);

        const integer = ctx.integer();
        const real = ctx.real();
        const src: NumberNode['src'] = integer ? {
            _kind: "unionnode",
            kind: "integer",
            node: integer.accept(this),
        } as NumberKindInteger : {
            _kind: "unionnode",
            kind: "real",
            node: real.accept(this),
        } as NumberKindReal;
        return {
            _kind: "baseastnode",
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
            _kind: "baseastnode",
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
            _kind: "baseastnode",
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
            _kind: "baseastnode",
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
                _kind: "unionterminal",
                kind: "escape",
                node: esc,
            };
            value = String.fromCharCode(parseInt(esc.getText().substring(1)));
        } else if (inv) {
            src = {
                _kind: "unionterminal",
                kind: "invalid",
                node: inv,
            };
            value = inv.getText();
        } else {
            src = {
                _kind: "unionterminal",
                kind: "content",
                node: content,
            };
            value = content.getText();
        }
        return {
            _kind: "baseastnode",
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
            _kind: "unionnode",
            kind: "literal",
            node: literal.accept(this),
        } as StringKindLiteral : {
            _kind: "unionnode",
            kind: "hex",
            node: hex.accept(this),
        } as StringKindHex;
        return {
            _kind: "baseastnode",
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
            _kind: "baseastnode",
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
                _kind: "unionnode",
                kind: "escape",
                node: escape.accept(this) as LStrEscapeNode
            };
            value = src.node.value;
        } else if (str) {
            src = {
                _kind: "unionnode",
                kind: "lstr",
                node: str.accept(this) as LStringNode,
            };
            value = '(' + src.node.value + ')';
        } else if (inv) {
            src = {
                _kind: "unionterminal",
                kind: "invalid_escape",
                node: inv
            };
            value = inv.getText().substring(1);
        } else {
            src = {
                _kind: "unionterminal",
                kind: "content",
                node: content
            };
            value = content.getText();
        }
        return {
            _kind: "baseastnode",
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
            _kind: "baseastnode",
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
                _kind: "unionterminal",
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
                _kind: "unionterminal",
                kind: "octal",
                node: octal,
            };
            value = String.fromCharCode(parseInt(octal.getText().substring(1), 8));
        } else {
            src = {
                _kind: "unionterminal",
                kind: "newline",
                node: newline,
            };
            value = '';
        }
        return {
            _kind: "baseastnode",
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
            _kind: "baseastnode",
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
                _kind: "unionterminal",
                kind: "content",
                node: content
            };
            value = split2(content.getText()).reduce((v, s) => v + String.fromCharCode(parseInt(s, 16)), "");
        } else {
            src = {
                _kind: "unionterminal",
                kind: "invalid",
                node: invalid,
            };
            value = '';
        }
        return {
            _kind: "baseastnode",
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
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            src: ctx.K_NULL(),
            value: null,
        };
    };

    // array

    visitArray: ((ctx: ArrayContext) => ArrayNode) = ctx => {
        if (ctx.exception) return this.errorNode(ctx, []);

        const contents = ctx.object_list().map(n => n.accept(this) as ObjectNode);
        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            src: {
                arrayOpen: ctx.ARRAY_OPEN(),
                contents: contents,
                arrayClose: ctx.ARRAY_CLOSE(),
            },
            value: contents.map(n => n.value),
        };
    };

    // dict

    visitDict: ((ctx: DictContext) => DictNode) = ctx => {
        if (ctx.exception) return this.errorNode(ctx, {});

        const pairs = ctx.dict_pair_list().map(n => n.accept(this) as DictPairNode);
        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            src: {
                dictOpen: ctx.DICT_OPEN(),
                contents: pairs,
                dictClose: ctx.DICT_CLOSE(),
            },
            value: pairs.reduce((p, n) => { p[n.value.name] = n.value.object !== undefined ? n.value.object : null; return p; }, {} as DictNode['value']),
        };
    };

    visitDict_pair: ((ctx: Dict_pairContext) => DictPairNode) = ctx => {
        if (ctx.exception) return this.errorNode(ctx, { name: "", object: null });

        const name = ctx.name().accept(this) as NameNode;
        const obj = ctx.object()?.accept(this) as ObjectNode | undefined;
        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            src: {
                name: name,
                object: obj,
            },
            value: {
                name: name.value,
                object: obj?.value,
            }
        };
    };

    // stream

    visitStream: ((ctx: StreamContext) => StreamNode) = ctx => {
        if (ctx.exception) return this.errorNode(ctx, { dict: {}, content: "" });

        const dict = ctx.dict().accept(this) as DictNode;
        const main = ctx.stream_main().accept(this) as StreamMainNode;
        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            src: {
                dict: dict,
                main: main,
            },
            value: {
                dict: dict.value,
                content: main.value,
            }
        };
    };

    visitStream_main: ((ctx: Stream_mainContext) => StreamMainNode) = ctx => {
        if (ctx.exception) return this.errorNode(ctx, "");

        const c = ctx.STREAM_CONTENT_ENDSTREAM();
        let s = c.getText();

        // strip eol following stream keyword
        if (s.slice(0, 2) === "\r\n") {
            s = s.slice(2);
        } else if (s[0] === "\n") {
            s = s.slice(1);
        }

        // strip endstream keyword
        s = s.slice(0, -'endstream'.length);

        // strip eol followed by endstream keyword
        if (s.slice(s.length - 2) === "\r\n") {
            s = s.slice(0, -2);
        } else if (s[s.length - 1] === "\n" || s[s.length - 1] === '\r') {
            s = s.slice(0, -1);
        }

        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            src: {
                k_stream: ctx.K_STREAM(),
                content_endstream: c,
            },
            value: s,
        };
    };

    // R

    visitIndirect_reference: ((ctx: Indirect_referenceContext) => IndirectReferenceNode) = ctx => {
        if (ctx.exception) return this.errorNode(ctx, { objNum: -1, genNum: -1 });

        const objNum = ctx.integer(0)?.accept(this) as IntegerNode | undefined;
        const genNum = ctx.integer(1)?.accept(this) as IntegerNode | undefined;
        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            src: {
                objNum: objNum,
                genNum: genNum,
                k_r: ctx.K_R(),
            },
            value: {
                objNum: objNum?.value,
                genNum: genNum?.value,
            },
        };
    };

    // xref

    visitXref_section: ((ctx: Xref_sectionContext) => XRefSectionNode) = ctx => {
        if (ctx.exception) return this.errorNode(ctx, []);

        const entries = ctx.xref_subsection_list().map(n => n.accept(this) as XRefSubsectionNode);
        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            src: {
                k_xref: ctx.K_XREF(),
                subsections: entries,
            },
            value: entries.map(n => n.value),
        };
    };

    visitXref_subsection: ((ctx: Xref_subsectionContext) => XRefSubsectionNode) = ctx => {
        if (ctx.exception) return this.errorNode(ctx, { header: { start: -1, len: -1 }, entries: [] });

        const header = ctx.xref_subsection_header().accept(this) as XRefSubsectionHeaderNode;
        const entries = ctx.xref_entry_list().map(n => n.accept(this) as XRefEntryNode);
        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            src: {
                header: header,
                entries: entries,
            },
            value: {
                header: header.value,
                entries: entries.map(n => n.value),
            }
        };
    };

    visitXref_subsection_header: ((ctx: Xref_subsection_headerContext) => XRefSubsectionHeaderNode) = ctx => {
        if (ctx.exception) return this.errorNode(ctx, { start: -1, len: -1 });

        const [start, len] = ctx.integer_list().map(n => n.accept(this) as IntegerNode);
        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            src: {
                start: start,
                len: len,
            },
            value: {
                start: start.value,
                len: len.value,
            },
        };
    };

    visitXref_entry: ((ctx: Xref_entryContext) => XRefEntryNode) = ctx => {
        if (ctx.exception) return this.errorNode(ctx, { n: -1, g: -1, type: "f" });

        const [n, g] = ctx.integer_list().map(n => n.accept(this) as IntegerNode);
        const ty = ctx.xref_type().accept(this) as XRefTypeNode;
        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            src: {
                n: n,
                g: g,
                type: ty,
            },
            value: {
                n: n.value,
                g: g.value,
                type: ty.value,
            }
        };
    };

    visitXref_type: ((ctx: Xref_typeContext) => XRefTypeNode) = ctx => {
        if (ctx.exception) return this.errorNode(ctx, "f");

        const ty = ctx.XREF_TYPE_N() || ctx.XREF_TYPE_F();
        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            src: ty,
            value: ty.getText() as "n" | "f",
        };
    };

    // trailer

    visitTrailer: ((ctx: TrailerContext) => TrailerNode) = ctx => {
        if (ctx.exception) return this.errorNode(ctx, { dict: {}, xrefOffset: -1 });

        let k_trailer: TerminalNode | undefined = ctx.K_TRAILER();
        if (((k_trailer as ErrorNode) as ErrorNode)) {
            k_trailer = undefined;
        }
        console.log(k_trailer);
        const dict = ctx.dict()?.accept(this) as DictNode;
        const xrefOffset = ctx.integer()?.accept(this) as IntegerNode;
        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            src: {
                k_trailer: k_trailer,
                dict: dict,
                k_startxref: ctx.K_STARTXREF(),
                xrefOffset: xrefOffset,
                eofMarker: ctx.H_EOF(),
            },
            value: {
                dict: dict?.value,
                xrefOffset: xrefOffset?.value,
            }
        };
    };

    // Error

    errorNode<RET extends BaseASTNode>(ctx: RET["ctx"], defaultValue: RET['value']): RET {
        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            value: defaultValue,
            exception: ctx.exception,
        } as RET;
    }
}

function calcPositionStart(ctx: ParserRuleContext): Position {
    return {
        line: ctx.start.line,
        column: ctx.start.column,
        start: ctx.start.start,
        stop: ctx.start.stop,
        length: ctx.start.stop - ctx.start.start + 1
    };
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
