import antlr4, { ParserRuleContext, TerminalNode } from "antlr4";
import { DictType, LocIndex, ParseResult, RangeIndex, RuleIndex, Scope } from "../types";
import PDFLexer from "../antlr/dist/PDFLexer";
import PDFParser, { BodyContext, DictionaryContext, Dictionary_entryContext, HeaderContext, Indirect_objContext, Indirect_refContext, IntegerContext, Invalid_codeContext, NameContext, ObjectContext, StartContext, StartxrefContext, StreamContext, TrailerContext, XrefContext } from "../antlr/dist/PDFParser";
import PDFParserListener from "../antlr/dist/PDFParserListener";
import * as lsp from "vscode-languageserver-protocol";
import { TokenWithEndPos } from "../antlr/lib";
import { BasePDFParserListener } from "./BasePDFParserListener";

type Nullish<T> = T | null | undefined;
type N<T> = Nullish<T>;

export class ScopeParser extends BasePDFParserListener {
    scopes: Scope[] = [];
    inTrailer: boolean = false;

    public result(): Scope[] {
        return this.scopes;
    }

    exitDictionary?: ((ctx: DictionaryContext) => void) = (ctx) => {
        const open = ctx.DICT_OPEN();
        const close = ctx.DICT_CLOSE() as N<TerminalNode>;
        const entries = ctx.dictionary_entry_list();

        const dictType: DictType = this.inTrailer ? "trailer" : "unknown";

        let lastToken: ParserRuleContext | TerminalNode = open;
        let lastMissingValue: boolean = false
        for (const entry of entries) {
            const name: N<NameContext> = entry.name();
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
}
