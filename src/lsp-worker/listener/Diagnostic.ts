import antlr4, { ParserRuleContext, TerminalNode } from "antlr4";
import { RuleIndex } from "../types";
import PDFLexer from "../antlr/dist/PDFLexer";
import PDFParser, { BodyContext, DictionaryContext, Dictionary_entryContext, HeaderContext, Indirect_objContext, Indirect_refContext, IntegerContext, Invalid_codeContext, NameContext, ObjectContext, StartContext, StartxrefContext, Startxref_invalidContext, StreamContext, TrailerContext, XrefContext, Xref_invalidContext } from "../antlr/dist/PDFParser";
import PDFParserListener from "../antlr/dist/PDFParserListener";
import * as lsp from "vscode-languageserver-protocol";
import { TokenWithEndPos } from "../antlr/lib";
import { BasePDFParserListener, N } from "./BasePDFParserListener";

export class DiagnosticParser extends BasePDFParserListener {
    diagnostic: lsp.Diagnostic[] = [];

    public result(): lsp.Diagnostic[] {
        return this.diagnostic;
    }

    exitStart: ((ctx: StartContext) => void) = (ctx) => {
        const header = ctx.header();
        const body = ctx.body();
        const xref = ctx.xref() as N<XrefContext>;
        const trailer = ctx.trailer() as N<TrailerContext>;
        const startxref = ctx.startxref() as N<StartxrefContext>;
        const eof = ctx.EOF() as N<TerminalNode>;
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

    exitDictionary: ((ctx: DictionaryContext) => void) = (ctx) => {
        const open = ctx.DICT_OPEN();
        const close = ctx.DICT_CLOSE() as N<TerminalNode>;
        const entries = ctx.dictionary_entry_list();

        let lastToken: ParserRuleContext | TerminalNode = open;
        for (const entry of entries) {
            const name: N<NameContext> = entry.name();
            const value = entry.object();

            // Diagnostic
            if (name === null) {
                if ((value.getChild(0) as RuleIndex).ruleIndex === PDFParser.RULE_name) {
                    // value がない（value の中身が name の）場合
                    // 最後のエントリでしか発生し得ない
                    const range = close ? this.betweenRange(lastToken, close, false, false) : this.tailRange(value);
                    if (close) {
                        this.diagnostic.push({
                            range: range,
                            message: "dictionary entry must have value",
                            severity: lsp.DiagnosticSeverity.Error,
                        });
                    }
                } else {
                    // name がない場合
                    this.diagnostic.push({
                        range: this.betweenRange(lastToken, value, false, false),
                        message: "dictionary entry must have name",
                        severity: lsp.DiagnosticSeverity.Error,
                    });
                }
            }

            lastToken = value;
        }

        if (!close) {
            this.diagnostic.push({
                range: this.tailRange(ctx),
                message: "dictionary must be closed",
                severity: lsp.DiagnosticSeverity.Error,
            });
        }
    };

    exitInvalid_code: ((ctx: Invalid_codeContext) => void) = (ctx) => {
        this.diagnostic.push({
            range: this.range(ctx),
            message: "invalid code",
            severity: lsp.DiagnosticSeverity.Error,
        });
    };

    exitXref_invalid: ((ctx: Xref_invalidContext) => void) = (ctx) => {
        this.diagnostic.push({
            range: this.range(ctx),
            message: "invalid code",
            severity: lsp.DiagnosticSeverity.Error,
        });
    };

    exitStartxref_invalid?: ((ctx: Startxref_invalidContext) => void) = (ctx) => {
        this.diagnostic.push({
            range: this.range(ctx),
            message: "invalid code",
            severity: lsp.DiagnosticSeverity.Error,
        });
    }
}
