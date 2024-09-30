import antlr4, { ParserRuleContext, TerminalNode } from "antlr4";
import { RangeIndex } from "../types";
import PDFParser, { IntegerContext, NameContext, NumberContext, RealContext, StartContext } from "../antlr/dist/PDFParser";
import PDFParserListener from "../antlr/dist/PDFParserListener";
import { TokenWithEndPos } from "../antlr/lib";
import { PDFLexerEx } from "../antlr/PDFLexerEX";

export type Nullish<T> = T | null | undefined;
export type N<T> = Nullish<T>;

export type Positional = ParserRuleContext | TerminalNode;

export class BasePDFParserListener extends PDFParserListener {
    public static parse(source: string, listeners: BasePDFParserListener[]): StartContext {
        const chars = antlr4.CharStreams.fromString(source);
        const lexer = new PDFLexerEx(chars);

        const tokens = new antlr4.CommonTokenStream(lexer);
        const parser = new PDFParser(tokens);
        listeners.forEach(listener => parser.addParseListener(listener));

        return parser.start();
    }
}

export class TreeTools {
    public static parseNumber(n: NumberContext): number {
        if (n.integer() !== null) {
            return this.parseInteger(n.integer());
        } else {
            return this.parseReal(n.real());
        }
    }

    public static parseInteger(n: IntegerContext): number {
        return parseInt(n.getText(), 10);
    }

    public static parseReal(n: RealContext): number {
        return parseFloat(n.getText());
    }

    public static parseName(n: NameContext): string {
        // TODO: escape 解釈
        return n.getText();
    }

    public static headRange(ctx: Positional): RangeIndex {
        const t = this.token(ctx);
        return {
            start: {
                line: t.start.line - 1,
                character: t.start.column,
                index: t.start.start,
            },
            end: {
                line: t.start.line - 1,
                character: t.start.column + 1,
                index: t.start.start + 1,
            },
        }
    }

    public static tailRange(ctx: Positional): RangeIndex {
        const t = this.token(ctx);
        return {
            start: {
                line: t.stop.endLine - 1,
                character: t.stop.endColumn - 1,
                index: t.stop.stop - 1,
            },
            end: {
                line: t.stop.endLine - 1,
                character: t.stop.endColumn,
                index: t.stop.stop,
            }
        }
    }

    public static betweenRange(
        ctx1: Positional,
        ctx2: Positional,
        includeStart: boolean = true,
        includeStop: boolean = true
    ): RangeIndex {
        const start = this.token(ctx1);
        const stop = this.token(ctx2);
        return {
            start: includeStart ? {
                line: start.start.line - 1,
                character: start.start.column,
                index: start.start.start,
            } : {
                line: start.stop.endLine - 1,
                character: start.stop.endColumn,
                index: start.stop.stop,
            },
            end: includeStop ? {
                line: stop.stop.endLine - 1,
                character: stop.stop.endColumn,
                index: stop.stop.stop,
            } : {
                line: stop.start.line - 1,
                character: stop.start.column,
                index: stop.start.start,
            }
        }
    }

    public static betweenRangeExclude(ctx1: Positional, ctx2: Positional): RangeIndex {
        return this.betweenRange(ctx1, ctx2, false, false);
    }

    public static range(ctx: Positional): RangeIndex {
        const t = this.token(ctx);
        return {
            start: {
                line: t.start.line - 1,
                character: t.start.column,
                index: t.start.start,
            },
            end: {
                line: t.stop.endLine - 1,
                character: t.stop.endColumn,
                index: t.stop.stop,
            },
        };
    }

    public static token(n: ParserRuleContext | TerminalNode) {
        if (n instanceof TerminalNode) {
            return {
                start: n.symbol as TokenWithEndPos,
                stop: n.symbol as TokenWithEndPos,
            };
        } else {
            return {
                start: n.start as TokenWithEndPos,
                stop: (n.stop || n.start) as TokenWithEndPos,
            }
        }
    }
}
