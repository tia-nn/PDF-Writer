import antlr4, { ParserRuleContext, RuleContext, TerminalNode } from "antlr4";
import PDFLexer from "./antlr/dist/PDFLexer";
import PDFParser, { BodyContext, DictionaryContext, HeaderContext, Invalid_codeContext, StartContext } from "./antlr/dist/PDFParser";
import PDFParserListener from "./antlr/dist/PDFParserListener";
import { ParseResult, RuleIndex } from "./types";
import { Diagnostic, DiagnosticSeverity } from "vscode-languageserver";
import * as lsp from "vscode-languageserver";

export class PDFLanguageParser extends PDFParserListener {
    diagnostic: Diagnostic[] = [];

    exitHeader: ((ctx: HeaderContext) => void) = (ctx) => {
        const header = ctx.H_PDF();
        if (header === null) {
            this.diagnostic.push({
                range: this.headRange(ctx),
                message: "PDF must start with %PDF-{version}"
            });
        }
    };

    exitBody: ((ctx: BodyContext) => void) = (ctx) => {
        const objects = ctx.object_list();
        for (const object of objects) {
            const entity = object.getChild(0) as RuleIndex;
            if (entity.ruleIndex !== PDFParser.RULE_indirect_obj && entity.ruleIndex !== PDFParser.RULE_invalid_code) {
                this.diagnostic.push({
                    range: this.range(entity),
                    message: "root object shall be indirect object",
                    severity: DiagnosticSeverity.Warning,
                });
            }
        }
    }

    exitInvalid_code: ((ctx: Invalid_codeContext) => void) = (ctx) => {
        this.diagnostic.push({
            range: this.range(ctx),
            message: "invalid code",
            severity: DiagnosticSeverity.Error,
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

    // visitTerminal(node: TerminalNode) {
    //     const s = node.symbol;
    //     console.log(`${PDFLexer.symbolicNames[s.type]}\t"${node.getText()}"`);
    // }

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
        };
    }
}
