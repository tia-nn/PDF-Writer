import antlr4, { ParserRuleContext, TerminalNode } from "antlr4";
import { DictType, ParseResult, RuleIndex, Scope } from "./types";
import PDFLexer from "./antlr/dist/PDFLexer";
import PDFParser, { BodyContext, DictionaryContext, Dictionary_entryContext, HeaderContext, Invalid_codeContext, NameContext, ObjectContext, StartContext, StartxrefContext, TrailerContext, XrefContext } from "./antlr/dist/PDFParser";
import PDFParserListener from "./antlr/dist/PDFParserListener";
import * as lsp from "vscode-languageserver-protocol";

export class PDFLanguageParser extends PDFParserListener {
    diagnostic: lsp.Diagnostic[] = [];
    scopes: Scope[] = [];
    inTrailer: boolean = false;

    exitStart?: ((ctx: StartContext) => void) = (ctx) => {
        const header = ctx.header();
        const body = ctx.body();
        const xref = ctx.xref() as XrefContext | null;
        const trailer = ctx.trailer() as TrailerContext | null;
        const startxref = ctx.startxref() as StartxrefContext | null;
        const eof = ctx.EOF() as TerminalNode | null;
    }

    exitHeader: ((ctx: HeaderContext) => void) = (ctx) => {
        const header = ctx.H_PDF();
        if (header === null) {
            this.diagnostic.push({
                range: this.headRange(ctx),
                message: "PDF must start with %PDF-{version}",
                severity: lsp.DiagnosticSeverity.Error,
            });
        }
    };

    exitBody: ((ctx: BodyContext) => void) = (ctx) => {
        // Diagnostic
        const objects = ctx.object_list();
        for (const object of objects) {
            const entity = object.getChild(0) as RuleIndex;
            if (entity.ruleIndex !== PDFParser.RULE_indirect_obj && entity.ruleIndex !== PDFParser.RULE_invalid_code) {
                this.diagnostic.push({
                    range: this.range(entity),
                    message: "root object shall be indirect object",
                    severity: lsp.DiagnosticSeverity.Warning,
                });
            }
        }
    };

    exitObject?: ((ctx: ObjectContext) => void) = (ctx) => {
    };

    exitDictionary?: ((ctx: DictionaryContext) => void) = (ctx) => {
        const open = ctx.DICT_OPEN();
        const close = ctx.DICT_CLOSE() as TerminalNode | null;
        const entries = ctx.dictionary_entry_list();

        const dictType: DictType = this.inTrailer ? "trailer" : "unknown";

        let lastToken: ParserRuleContext | TerminalNode = open;
        let lastMissingValue: boolean = false
        for (const entry of entries) {
            const name: NameContext | null = entry.name();
            const value = entry.object();

            // Diagnostic
            if (name === null) {
                if ((value.getChild(0) as RuleIndex).ruleIndex === PDFParser.RULE_name) {
                    // value がない場合。末尾にしか現れない
                    // Diagnostic と value スコープはループ外で処理する
                    this.scopes.push({
                        range: this.betweenRange(lastToken, value, false, true),
                        kind: "dict-key",
                        dictType: dictType,
                    })
                    lastMissingValue = true
                } else {
                    // name がない場合
                    this.diagnostic.push({
                        range: this.betweenRange(lastToken, value, false, false),
                        message: "dictionary entry must have name",
                        severity: lsp.DiagnosticSeverity.Error,
                    });

                    this.scopes.push({
                        range: this.betweenRange(lastToken, value, false, false),
                        kind: "dict-key",
                        dictType: dictType,
                    })
                    this.scopes.push({
                        range: this.range(value),
                        kind: "dict-value",
                        key: "unknown",
                        dictType: dictType,
                    })
                }
                lastToken = value;
            } else {
                this.scopes.push({
                    range: this.betweenRange(lastToken, name, false, true),
                    kind: "dict-key",
                    dictType: dictType,
                });
                this.scopes.push({
                    range: this.betweenRange(name, value, false, true),
                    kind: "dict-value",
                    key: name.getText(),
                    dictType: dictType,
                });
                lastToken = value;
            }
        }

        // 最後のエントリから close までの処理
        if (close) {
            if (lastMissingValue) {
                this.diagnostic.push({
                    range: this.betweenRange(lastToken, close, false, false),
                    message: "dictionary entry must have value",
                    severity: lsp.DiagnosticSeverity.Error,
                });

                this.scopes.push({
                    range: this.betweenRange(lastToken, close, false, false),
                    kind: "dict-value",
                    key: (lastToken as NameContext).getText(),
                    dictType: dictType,
                });
            } else {
                this.scopes.push({
                    range: this.betweenRange(lastToken, close, false, false),
                    kind: "dict-key",
                    dictType: dictType,
                });
            }
        }
    };

    exitDictionary_entry: ((ctx: Dictionary_entryContext) => void) = (ctx) => {
        // this.scopes.push({
        //     range: this.range(ctx),
        //     kind: "dict",
        //     dictDetail: "key",
        //     dictType: "unknown",
        // });
    };

    enterTrailer: ((ctx: TrailerContext) => void) = (ctx) => {
        this.inTrailer = true;
    }

    exitTrailer: ((ctx: TrailerContext) => void) = (ctx) => {
        this.inTrailer = false;
    }

    exitInvalid_code: ((ctx: Invalid_codeContext) => void) = (ctx) => {
        this.diagnostic.push({
            range: this.range(ctx),
            message: "invalid code",
            severity: lsp.DiagnosticSeverity.Error,
        });
    };

    headRange(ctx: ParserRuleContext): lsp.Range {
        return {
            start: {
                line: ctx.start.line - 1,
                character: ctx.start.column,
            },
            end: {
                line: ctx.start.line - 1,
                character: ctx.start.column + 1,
            }
        }
    }

    tailRange(ctx: ParserRuleContext): lsp.Range {
        const stop = ctx.stop || ctx.start
        const stopLine = stop.line - 1
        const stopColumn = stop.column + stop.stop - stop.start + 1;
        return {
            start: {
                line: stopLine,
                character: stopColumn - 1,
            },
            end: {
                line: stopLine,
                character: stopColumn,
            }
        }
    }

    betweenRange(
        ctx1: ParserRuleContext | TerminalNode,
        ctx2: ParserRuleContext | TerminalNode,
        includeStart: boolean = true,
        includeStop: boolean = true
    ): lsp.Range {
        const start = this.token(ctx1);
        const stop = this.token(ctx2);
        return {
            start: includeStart ? {
                line: start.start.line - 1,
                character: start.start.column,
            } : {
                line: start.stop.line - 1,
                character: start.stop.column + start.stop.stop - start.stop.start + 1,
            },
            end: includeStop ? {
                line: stop.stop.line - 1,
                character: stop.stop.column + stop.stop.stop - stop.stop.start + 1,
            } : {
                line: stop.start.line - 1,
                character: stop.start.column,
            }
        }
    }

    range(ctx: ParserRuleContext): lsp.Range {
        const stop = ctx.stop || ctx.start
        return {
            start: {
                line: ctx.start.line - 1,
                character: ctx.start.column
            },
            end: {
                line: stop.line - 1,
                character: stop.column + stop.stop - stop.start + 1
            }
        };
    }

    token(n: ParserRuleContext | TerminalNode) {
        if (n instanceof TerminalNode) {
            return {
                start: n.symbol,
                stop: n.symbol,
            };
        } else {
            return {
                start: n.start,
                stop: (n.stop || n.start),
            }
        }
    }

    public static parse(source: string): ParseResult {
        const chars = antlr4.CharStreams.fromString(source);
        const lexer = new PDFLexer(chars);

        const tokens = new antlr4.CommonTokenStream(lexer);
        const parser = new PDFParser(tokens);
        const listener = new PDFLanguageParser();
        parser.addParseListener(listener);
        parser.buildParseTrees = true;

        parser.start();

        return {
            diagnostic: listener.diagnostic,
            scopes: listener.scopes,
        };
    }
}
