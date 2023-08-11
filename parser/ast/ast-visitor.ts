import { ParseTree, ParserRuleContext, TerminalNode } from "antlr4";
import { ArrayContext, BodyContext, DictContext, DictPairContext, EscapeSequenceContext, HexStringContext, HexStringContentContext, IndirectObjectDefineContext, IndirectReferenceContext, IntegerContext, LiteralStringContext, LiteralStringContentContext, LiteralStringInnerContext, NameContext, NameContentContext, NullObjContext, NumberContext, ObjectContext, RealContext, StartContext, StreamContext, StreamMainContext, StringContext, TrailerContext, XrefEntryContext, XrefSectionContext, XrefSubsectionContext, XrefSubsectionHeaderContext, XrefTypeContext } from "../antlr/dist/PDFParser";
import PDFParserVisitor from "../antlr/dist/PDFParserVisitor";
import { BaseASTNode, ErrorReport, NodeSrc, UnionTerminal } from "./ast/base";
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
import { isErrorNode, isMissingNode } from "./TerminalNodeWithErrorCheck";

export class ASTVisitor extends PDFParserVisitor<BaseASTNode> {
    errors: ErrorReport[];

    constructor() {
        super();
        this.errors = [];
    }

    visitStart: ((ctx: StartContext) => BaseASTNode) = ctx => {
        const header = ctx.H_PDF();
        const body = ctx.body()?.accept(this) as any as BodyNode | undefined;
        const xref = ctx.xrefSection()?.accept(this) as any as XRefSectionNode | undefined;
        const trailer = ctx.trailer()?.accept(this) as any as TrailerNode | undefined;

        if (!header || isMissingNode(header)) this.errorPos({ line: 1, column: 0, start: 0, stop: 0, length: 0 }, "missing PDF Header.");
        if (!xref) this.error(ctx, "missing xref table.");
        if (!trailer) this.error(ctx, "missing trailer.");

        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            v: {
                header: header ? { src: header, value: isMissingNode(header) ? "missing" : "valid" } : undefined,
                body: body ? { src: body, } : undefined,
                xref: xref ? { src: xref, } : undefined,
                trailer: trailer ? { src: trailer, } : undefined,
            }
        } as StartNode;
    };

    visitBody: ((ctx: BodyContext) => BodyNode) = ctx => {
        const d = ctx.indirectObjectDefine_list().map(n => n.accept(this) as any as IndirectDefineNode);
        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            v: {
                src: d,
            }
        };
    };

    visitIndirectObjectDefine: ((ctx: IndirectObjectDefineContext) => IndirectDefineNode) = ctx => {
        const objNum = ctx.integer(0)?.accept(this) as any as IntegerNode | undefined;
        const genNum = ctx.integer(1)?.accept(this) as any as IntegerNode | undefined;
        const obj = ctx.object()?.accept(this) as any as ObjectNode | undefined;
        const kObj = ctx.K_OBJ() as TerminalNode | undefined;
        const kEndobj = ctx.K_ENDOBJ() as TerminalNode | undefined;

        if (!objNum) this.error(ctx, "missing object number.");
        if (!genNum) this.error(ctx, "missing generation number.");
        if (!obj) this.error(ctx, "missing object.");

        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            v: {
                objNum: objNum ? { src: objNum } : undefined,
                genNum: genNum ? { src: genNum } : undefined,
                kObj: kObj ? { src: kObj, value: isMissingNode(kObj) ? "missing" : "valid" } : undefined,
                object: obj ? { src: obj } : undefined,
                kEndobj: kEndobj ? { src: kEndobj, value: isMissingNode(kEndobj) ? "missing" : "valid" } : undefined,
            }
        };
    };

    visitObject: ((ctx: ObjectContext) => ObjectNode) = ctx => {
        // if (ctx.exception) return this.errorNode(ctx, null);

        const indirect = ctx.indirectReference();
        const stream = ctx.stream();
        const dict = ctx.dict();
        const array = ctx.array();
        const name = ctx.name();
        const number = ctx.number_();
        const string = ctx.string_();
        const null_ = ctx.nullObj();
        const v: ObjectNode['v'] = (() => {
            if (indirect) {
                return {
                    src: {
                        _kind: "unionnode",
                        kind: "reference",
                        node: indirect.accept(this) as any,
                    } as ObjKindIndirectReference,
                };
            } else if (stream) {
                return {
                    src: {
                        _kind: "unionnode",
                        kind: "stream",
                        node: stream.accept(this) as any,
                    } as ObjKindStream
                };
            } else if (dict) {
                return {
                    src: {
                        _kind: "unionnode",
                        kind: "dict",
                        node: dict.accept(this) as any,
                    } as ObjKindDict,
                };
            } else if (array) {
                return {
                    src: {
                        _kind: "unionnode",
                        kind: "array",
                        node: array.accept(this) as any,
                    } as ObjKindArray
                };
            } else if (name) {
                return {
                    src: {
                        _kind: "unionnode",
                        kind: "name",
                        node: name.accept(this) as any,
                    } as ObjKindName
                };
            } else if (number) {
                return {
                    src: {
                        _kind: "unionnode",
                        kind: "number",
                        node: number.accept(this) as any,
                    } as ObjKindNumber
                };
            } else if (string) {
                return {
                    src: {
                        _kind: "unionnode",
                        kind: "string",
                        node: string.accept(this) as any,
                    } as ObjKindString
                };
            } else if (null_) {
                return {
                    src: {
                        _kind: "unionnode",
                        kind: "null",
                        node: null_.accept(this) as any,
                    } as ObjKindNull
                };
            } else {
                return undefined;
            }
        })();

        if (!v) this.error(ctx, "missing object.");

        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            v: v,
        };
    };

    // Number

    visitNumber: ((ctx: NumberContext) => NumberNode) = ctx => {
        // if (ctx.exception) return this.errorNode(ctx, 0);

        const integer = ctx.integer();
        const real = ctx.real();
        const src: NumberNode['v']['src'] = integer ? {
            _kind: "unionnode",
            kind: "integer",
            node: integer.accept(this) as any as IntegerNode,
        } as NumberKindInteger : {
            _kind: "unionnode",
            kind: "real",
            node: real.accept(this) as any as RealNode,
        } as NumberKindReal;
        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            v: {
                src: src,
                value: src.node.v!.value,
            },
        };
    };

    visitInteger: ((ctx: IntegerContext) => IntegerNode) = ctx => {
        const src = ctx.INTEGER() as TerminalNode | undefined;
        const valueStr = src?.getText() || '';

        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            v: src ? {
                src: src,
                value: parseInt(valueStr),
                eType: isMissingNode(src) ? "missing" : "valid",
            } : undefined,
            is10Digits: Boolean(valueStr) && valueStr.length === 10,
            is5Digits: Boolean(valueStr) && valueStr.length === 5,
        };
    };

    visitReal: ((ctx: RealContext) => RealNode) = ctx => {
        const src = ctx.FLOAT() as TerminalNode;
        const valueStr = src?.getText() || '';

        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            v: {
                src: src,
                value: parseFloat(valueStr),
            },
        };
    };

    // Name

    visitName: ((ctx: NameContext) => NameNode) = ctx => {
        // if (ctx.exception) return this.errorNode(ctx, '');

        const prefix = ctx.NAME_PREFIX();

        const contents = ctx.nameContent_list().map(n => n.accept(this) as any as NameContentNode);
        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            v: {
                prefix: { src: prefix, },
                contents: { src: contents, value: contents.reduce((p, v) => p + v.v.value, "" as string), },
            }
        };
    };

    visitNameContent: ((ctx: NameContentContext) => NameContentNode) = ctx => {
        // if (ctx.exception) return this.errorNode(ctx, '');

        const esc = ctx.NAME_ESCAPE();
        const inv = ctx.NAME_ESC_INVALID();
        const content = ctx.NAME_CONTENT();
        let v: NameContentNode['v'];
        if (esc) {
            v = {
                src: {
                    _kind: "unionterminal",
                    kind: "escape",
                    node: esc,
                },
                value: String.fromCharCode(parseInt(esc.getText().substring(1))),
            };
        } else if (inv) {
            v = {
                src: {
                    _kind: "unionterminal",
                    kind: "invalid",
                    node: inv,
                },
                value: inv.getText(),
            };
        } else {
            v = {
                src: {
                    _kind: "unionterminal",
                    kind: "content",
                    node: content,
                },
                value: content.getText(),
            };
        }
        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            v: v,
        };
    };

    // String

    visitString: ((ctx: StringContext) => StringNode) = ctx => {
        // if (ctx.exception) return this.errorNode(ctx, "");

        const literal = ctx.literalString()?.accept(this) as any as LStringNode;
        const hex = ctx.hexString()?.accept(this) as any as HStringNode;
        const v: StringNode['v'] = literal ? {
            src: {
                _kind: "unionnode",
                kind: "literal",
                node: literal,
            } as StringKindLiteral,
            value: literal.v.LStrContents.value
        } : {
            src: {
                _kind: "unionnode",
                kind: "hex",
                node: hex,
            } as StringKindHex,
            value: hex.v.HStrContents.value,
        };
        return {
            _kind: "baseastnode",
            ctx: ctx,
            v: v,
            position: calcPosition(ctx),
        };
    };

    visitLiteralString: ((ctx: LiteralStringContext) => LStringNode) = ctx => {
        // if (ctx.exception) return this.errorNode(ctx, '');

        const close = ctx.LSTR_QUOTE_CLOSE() as TerminalNode | undefined;
        const contents = ctx.literalStringContent_list().map(n => n.accept(this) as any as LStrContentNode);
        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            v: {
                LStrQuoteOpen: { src: ctx.LSTR_QUOTE_OPEN() },
                LStrContents: { src: contents, value: contents.reduce((p, v) => p + v.v.value, "") },
                LStrQuoteClose: close ? { src: close, value: isMissingNode(close) ? "missing" : "valid" } : undefined,
            }
        };
    };

    visitLiteralStringContent: ((ctx: LiteralStringContentContext) => LStrContentNode) = ctx => {
        // if (ctx.exception) return this.errorNode(ctx, '');

        const escape = ctx.escapeSequence()?.accept(this) as any as LStrEscapeNode;
        const str = ctx.literalStringInner()?.accept(this) as any as LStringNode;
        const inv = ctx.INVALID_ESCAPE() as any as TerminalNode;
        const content = ctx.LSTR_CONTENT() as any as TerminalNode;

        let v: LStrContentNode['v'];
        if (escape) {
            v = {
                src: {
                    _kind: "unionnode",
                    kind: "escape",
                    node: escape,
                },
                value: escape.v.value,
            };
        } else if (str) {
            v = {
                src: {
                    _kind: "unionnode",
                    kind: "lstr",
                    node: str,
                },
                value: '(' + str.v.LStrContents.value + ')',
            };
        } else if (inv) {
            v = {
                src: {
                    _kind: "unionterminal",
                    kind: "invalidEscape",
                    node: inv,
                },
                value: inv.getText().substring(1),
            };
        } else {
            v = {
                src: {
                    _kind: "unionterminal",
                    kind: "content",
                    node: content,
                },
                value: content.getText(),
            };
        }
        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            v: v,
        };
    };

    visitLiteralStringInner: ((ctx: LiteralStringInnerContext) => LStringNode) = ctx => {
        // if (ctx.exception) return this.errorNode(ctx, '');

        const close = ctx.LSTR_QUOTE_CLOSE() as TerminalNode | undefined;
        const contents = ctx.literalStringContent_list().map(n => n.accept(this) as any as LStrContentNode);
        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            v: {
                LStrQuoteOpen: { src: ctx.LSTR_QUOTE_OPEN_INNER() },
                LStrContents: { src: contents, value: contents.reduce((p, v) => p + v.v.value, "") },
                LStrQuoteClose: close ? { src: close, value: isMissingNode(close) ? "missing" : "valid" } : undefined,
            }
        };
    };

    visitEscapeSequence: ((ctx: EscapeSequenceContext) => LStrEscapeNode) = ctx => {
        // if (ctx.exception) return this.errorNode(ctx, '');

        const char = ctx.ESCAPE_CHAR();
        const octal = ctx.ESCAPE_OCTAL();
        const newline = ctx.ESCAPE_NEWLINE();
        let v: LStrEscapeNode['v'];
        if (char) {
            v = {
                src: {
                    _kind: "unionterminal",
                    kind: "char",
                    node: char
                },
                value: '',
            };
            const t = char.getText().substring(1);
            switch (t) {
                case 'n':
                    v.value = '\n';
                    break;
                case 'r':
                    v.value = "\r";
                    break;
                case 't':
                    v.value = '\t';
                    break;
                case 'b':
                    v.value = '\b';
                    break;
                case 'f':
                    v.value = '\f';
                    break;
                default:
                    v.value = t;
            }
        } else if (octal) {
            v = {
                src: {
                    _kind: "unionterminal",
                    kind: "octal",
                    node: octal,
                },
                value: String.fromCharCode(parseInt(octal.getText().substring(1), 8)),
            };
        } else {
            v = {
                src: {
                    _kind: "unionterminal",
                    kind: "newline",
                    node: newline,
                },
                value: ''
            };
        }
        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            v: v,
        };
    };

    visitHexString: ((ctx: HexStringContext) => HStringNode) = ctx => {
        // if (ctx.exception) return this.errorNode(ctx, '');

        const close = ctx.HSTR_QUOTE_CLOSE() as TerminalNode | undefined;
        const contents = ctx.hexStringContent_list().map(n => n.accept(this) as any as HStrContentNode);
        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            v: {
                HStrQuoteOpen: { src: ctx.HSTR_QUOTE_OPEN() },
                HStrContents: { src: contents, value: contents.reduce((p, v) => p + v.v.value, "") },
                HStrQuoteClose: close ? { src: close, value: isMissingNode(close) ? "missing" : "valid", } : undefined,
            }
        };
    };

    visitHexStringContent: ((ctx: HexStringContentContext) => HStrContentNode) = ctx => {
        // if (ctx.exception) return this.errorNode(ctx, '');

        const content = ctx.HSTR_CONTENT();
        const invalid = ctx.HSTR_INVALID();
        let src: HStrContentNode['v'];
        if (content) {
            src = {
                src: {
                    _kind: "unionterminal",
                    kind: "content",
                    node: content
                },
                value: split2(content.getText()).reduce((v, s) => v + String.fromCharCode(parseInt(s, 16)), ""),
            };
        } else {
            src = {
                src: {
                    _kind: "unionterminal",
                    kind: "invalid",
                    node: invalid,
                },
                value: '',
            };
        }
        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            v: src,
        };
    };

    // null

    visitNullObj: ((ctx: NullObjContext) => NullObjectNode) = ctx => {
        // if (ctx.exception) return this.errorNode(ctx, null);

        const null_ = ctx.K_NULL();
        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            v: null_ ? { src: null_, value: null } : undefined,
        };
    };

    // array

    visitArray: ((ctx: ArrayContext) => ArrayNode) = ctx => {
        // if (ctx.exception) return this.errorNode(ctx, []);

        const close = ctx.ARRAY_CLOSE() as TerminalNode | undefined;
        const contents = ctx.object_list().map(n => n.accept(this) as any as ObjectNode);
        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            v: {
                arrayOpen: { src: ctx.ARRAY_OPEN(), },
                contents: { src: contents },
                arrayClose: close ? { src: close, value: isMissingNode(close) ? "missing" : "valid", } : undefined,
            },
        };
    };

    // dict

    visitDict: ((ctx: DictContext) => DictNode) = ctx => {
        // if (ctx.exception) return this.errorNode(ctx, {});

        const close = ctx.DICT_CLOSE() as TerminalNode | undefined;
        const pairs = ctx.dictPair_list().map(n => n.accept(this) as any as DictPairNode);
        const obj: Record<string, ObjectNode | undefined> = {};
        for (let i = 0; i < pairs.length; i++) {
            const p = pairs[i];
            if (p.v.name != undefined) obj[p.v.name.value] = p.v.object?.src;
        }
        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            v: {
                dictOpen: { src: ctx.DICT_OPEN(), },
                contents: { src: pairs, srcObj: obj },
                dictClose: close ? { src: close, value: isMissingNode(close) ? "missing" : "valid", } : undefined,
            },
        };
    };

    visitDictPair: ((ctx: DictPairContext) => DictPairNode) = ctx => {
        // if (ctx.exception) return this.errorNode(ctx, { name: "", object: null });

        const name = ctx.name()?.accept(this) as any as NameNode | undefined;
        const obj = ctx.object()?.accept(this) as any as ObjectNode | undefined;

        if (!name) this.error(ctx, "missing key name.");
        if (!obj) this.error(ctx, "missing value object.");

        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            v: {
                name: name ? { src: name, value: name.v.contents.value } : undefined,
                object: obj ? { src: obj } : undefined,
            }
        };
    };

    // stream

    visitStream: ((ctx: StreamContext) => StreamNode) = ctx => {
        const dict = ctx.dict()?.accept(this) as any as DictNode | undefined;
        const main = ctx.streamMain()?.accept(this) as any as StreamMainNode;

        if (!dict) this.error(ctx, "missing stream dictionary.");
        if (!main) this.error(ctx, "missing stream part.");

        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            v: {
                dict: dict ? { src: dict, } : undefined,
                main: { src: main, value: main.v.contentKEndStream?.value || '', },
            },
        };
    };

    visitStreamMain: ((ctx: StreamMainContext) => StreamMainNode) = ctx => {
        const c = ctx.STREAM_CONTENT_ENDSTREAM() as TerminalNode | undefined;
        let s = c?.getText() as string | undefined;

        if (!c) this.error(ctx, "missing endstream keyword.");

        // strip eol following stream keyword
        if (s == undefined) {
            s = '';
        } else if (s.slice(0, 2) === "\r\n") {
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
            v: {
                kStream: { src: ctx.K_STREAM() },
                contentEndstream: c ? { src: c, value: s } : undefined,
            },
            value: s,
        };
    };

    // R

    visitIndirectReference: ((ctx: IndirectReferenceContext) => IndirectReferenceNode) = ctx => {
        const r = ctx.K_R() as TerminalNode;
        const objNum = ctx.integer(0)?.accept(this) as any as IntegerNode | undefined;
        const genNum = ctx.integer(1)?.accept(this) as any as IntegerNode | undefined;

        if (!objNum) this.error(ctx, "missing object number.");
        if (!genNum) this.error(ctx, "missing generation number.");

        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            v: {
                objNum: objNum ? { src: objNum, } : undefined,
                genNum: genNum ? { src: genNum, } : undefined,
                kR: { src: r, value: isErrorNode(r) ? "missing" : "valid", },
            }
        };
    };

    // xref

    visitXrefSection: ((ctx: XrefSectionContext) => XRefSectionNode) = ctx => {
        // if (ctx.exception) return this.errorNode(ctx, []);

        const kXref = ctx.K_XREF() as TerminalNode | undefined;
        const entries = ctx.xrefSubsection_list().map(n => n.accept(this) as any as XRefSubsectionNode);
        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            v: {
                kXref: kXref ? { src: kXref, value: isErrorNode(kXref) ? "missing" : "valid", } : undefined,
                subsections: { src: entries, },
            }
        };
    };

    visitXrefSubsection: ((ctx: XrefSubsectionContext) => XRefSubsectionNode) = ctx => {
        // if (ctx.exception) return this.errorNode(ctx, { header: { start: -1, len: -1 }, entries: [] });

        const header = ctx.xrefSubsectionHeader()?.accept(this) as any as XRefSubsectionHeaderNode | undefined;
        const entries = ctx.xrefEntry_list().map(n => n.accept(this) as any as XRefEntryNode);

        if (!header) this.error(ctx, "missing xref subsection header.");

        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            v: {
                header: header ? { src: header } : undefined,
                entries: { src: entries },
            },
        };
    };

    visitXrefSubsectionHeader: ((ctx: XrefSubsectionHeaderContext) => XRefSubsectionHeaderNode) = ctx => {
        const start = ctx.integer(0)?.accept(this) as any as IntegerNode | undefined;
        const len = ctx.integer(1)?.accept(this) as any as IntegerNode | undefined;

        if (!start) this.error(ctx, "missing object number of first object in xref subsection header.");
        if (!len) this.error(ctx, "missing number of entries in xref subsection header.");

        console.log((start?.ctx.start as any).source);

        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            v: {
                start: start ? { src: start } : undefined,
                len: len ? { src: len } : undefined,
            },
        };

    };

    visitXrefEntry: ((ctx: XrefEntryContext) => XRefEntryNode) = ctx => {
        const n = ctx.integer(0)?.accept(this) as any as IntegerNode;
        const g = ctx.integer(1)?.accept(this) as any as IntegerNode;
        const ty = ctx.xrefType()?.accept(this) as any as XRefTypeNode;

        if (!ty) {
            this.error(ctx, "missing entry type in xref entry.");
            if (!n) this.error(ctx, "missing object number in xref entry.");
            if (!g) this.error(ctx, "missing generation number in xref entry.");
        } else if (ty.v.value === "n") {
            if (!n) this.error(ctx, "missing object number in xref entry.");
            if (!g) this.error(ctx, "missing generation number in xref entry.");
        } else { // ty.value === "f"
            if (!n) this.error(ctx, "missing object number of next free object in xref entry.");
            if (!g) this.error(ctx, "missing generation number in xref entry.");
        }

        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            v: {
                n: { src: n },
                g: { src: g },
                type: { src: ty },
            },
        };
    };

    visitXrefType: ((ctx: XrefTypeContext) => XRefTypeNode) = ctx => {
        const ty = (ctx.XREF_TYPE_N() || ctx.XREF_TYPE_F()) as TerminalNode;
        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            v: { src: ty, value: ty.getText() as "n" | "f" },
        };
    };

    // trailer

    visitTrailer: ((ctx: TrailerContext) => TrailerNode) = ctx => {
        let kTrailer: TerminalNode | undefined = ctx.K_TRAILER();
        const dict = ctx.dict()?.accept(this) as any as DictNode;
        const xrefOffset = ctx.integer()?.accept(this) as any as IntegerNode;
        const kStartxref = ctx.K_STARTXREF() as TerminalNode | undefined;
        const eofMarker = ctx.H_EOF() as TerminalNode | undefined;

        if (!dict) this.error(ctx, "missing trailer dictionary.");
        if (!xrefOffset) this.error(ctx, "missing xref table offset.");

        return {
            _kind: "baseastnode",
            ctx: ctx,
            position: calcPosition(ctx),
            v: {
                kTrailer: kTrailer ? { src: kTrailer, value: isErrorNode(kTrailer) ? "missing" : "valid", } : undefined,
                dict: dict ? { src: dict, } : undefined,
                kStartxref: kStartxref ? { src: kStartxref, value: isErrorNode(kStartxref) ? "missing" : "valid", } : undefined,
                xrefOffset: xrefOffset ? { src: xrefOffset, } : undefined,
                eofMarker: eofMarker ? { src: eofMarker, value: isErrorNode(eofMarker) ? "missing" : "valid", } : undefined,
            },
        };
    };

    // Error

    // errorNode<RET extends BaseASTNode>(ctx: RET["ctx"], defaultValue: RET['value']): RET {
    //     return {
    //         _kind: "baseastnode",
    //         ctx: ctx,
    //         position: calcPosition(ctx),
    //         value: defaultValue,
    //         exception: ctx.exception,
    //     } as RET;
    // }

    error(ctx: ParserRuleContext, message: string) {
        const err: ErrorReport = {
            position: calcPositionStart(ctx),
            message: message,
        };
        this.errors.push(err);
        return err;
    }

    errorPos(pos: Position, message: string) {
        const err: ErrorReport = {
            position: pos,
            message: message,
        };
        this.errors.push(err);
        return err;
    }
}

function calcPositionStart(ctx: ParserRuleContext): Position {
    return {
        line: ctx.start.line,
        column: ctx.start.column,
        start: ctx.start.start,
        stop: ctx.start.stop + 1,
        length: ctx.start.stop - ctx.start.start + 1
    };
}

function calcPosition(ctx: ParserRuleContext): Position {
    if (ctx.children == null || ctx.getChildCount() == 0 || ctx.stop == null) {
        return {
            line: ctx.start.line,
            column: ctx.start.column,
            start: ctx.start.start,
            stop: ctx.start.stop + 1,
            length: ctx.start.stop - ctx.start.start + 1
        };
    } else {
        return {
            line: ctx.start.line,
            column: ctx.start.column,
            start: ctx.start.start,
            stop: ctx.stop.stop + 1,
            length: ctx.stop.stop - ctx.start.start + 1
        };
    }
}

function split2(s: string) {
    const result: string[] = [];
    for (let i = 0; i < s.length; i += 2) {
        result.push(s.substring(i, i + 2));
    }
    return result;
}
