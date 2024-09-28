import antlr4, { ParserRuleContext, TerminalNode } from "antlr4";
import { DictTokenType, LocIndex, ParseResult, RangeIndex, RuleIndex, Scope } from "../types";
import PDFLexer from "../antlr/dist/PDFLexer";
import PDFParser, { BodyContext, DictionaryContext, Dictionary_entryContext, HeaderContext, Indirect_objContext, Indirect_refContext, IntegerContext, Invalid_codeContext, NameContext, ObjectContext, StartContext, StartxrefContext, StreamContext, TrailerContext, XrefContext } from "../antlr/dist/PDFParser";
import PDFParserListener from "../antlr/dist/PDFParserListener";
import * as lsp from "vscode-languageserver-protocol";
import { TokenWithEndPos } from "../antlr/lib";
import { BasePDFParserListener, N } from "./BasePDFParserListener";
import { DictType, DICT_TYPE } from '@/tools/dictTyping';


export class DictKeyDetector extends BasePDFParserListener {
    key: DictTokenType | null = null;
    inTrailer: boolean = false;
    position: lsp.Position;

    constructor(position: lsp.Position) {
        super();
        this.position = position;
    }

    public result(): DictTokenType | null {
        return this.key;
    }

    exitDictionary?: ((ctx: DictionaryContext) => void) = (ctx) => {
        if (this.key) return;

        const range = this.range(ctx);
        if (!this.isInRange(range, this.position)) {
            return;
        }

        const entries = ctx.dictionary_entry_list();

        let dictType: DictType = this.inTrailer ? "trailer" : "unknown";
        let inRangeKey: string | null = null;
        let inRangeValueName: { key: string, value: string } | null = null;
        for (const entry of entries) {
            const nameRule = entry.name();
            const valueRule = entry.object();
            const valueChild = valueRule.getChild(0) as RuleIndex;
            let name: N<NameContext> = null;
            let value: N<ObjectContext | NameContext> = null;
            let valueIsName = false;

            if (nameRule) {
                name = nameRule as N<NameContext>;
                value = valueRule;
                valueIsName = valueChild.ruleIndex === PDFParser.RULE_name;
            } else if (valueChild.ruleIndex === PDFParser.RULE_name) {
                name = valueChild as NameContext;
                value = null;
                valueIsName = false;
            } else {
                name = null;
                value = valueRule;
                valueIsName = valueChild.ruleIndex === PDFParser.RULE_name;
            }

            const nameStr = name ? this.parseName(name) : null;

            // /Type がある場合は dictType を決定
            if (dictType === "unknown" && nameStr === "/Type" && valueIsName) {
                const valueStr = this.parseName(valueChild as NameContext);
                if ((DICT_TYPE as ReadonlyArray<string>).includes(valueStr)) {
                    dictType = valueStr as DictType;
                }
            }

            if (inRangeKey || inRangeValueName) continue;

            // 現在位置が name の範囲内なら key として記録
            if (name && this.isInRange(this.range(name), this.position)) {
                inRangeKey = this.parseName(name);
            }
            else if (name && value && valueIsName && this.isInRange(this.range(value), this.position)) {
                inRangeValueName = {
                    key: this.parseName(name),
                    value: this.parseName(valueChild as NameContext)
                };
            }
        }
        if (inRangeKey) {
            this.key = {
                type: "dict-key",
                dictType: dictType,
                key: inRangeKey,
            }
        } else if (inRangeValueName) {
            this.key = {
                type: "dict-value",
                dictType: dictType,
                key: inRangeValueName.key,
                valueName: inRangeValueName.value,
            }
        }
    };

    enterTrailer: ((ctx: TrailerContext) => void) = (ctx) => {
        this.inTrailer = true;
    };

    exitTrailer?: ((ctx: TrailerContext) => void) = (ctx) => {
        this.inTrailer = false;
    };

    private isInRange(range: lsp.Range, position: lsp.Position): boolean {
        if (range.start.line <= position.line && position.line <= range.end.line) {
            if (range.start.line === range.end.line) {
                return range.start.character <= position.character && position.character <= range.end.character
            } else {
                if (range.start.line === position.line) {
                    return range.start.character <= position.character;
                }
                if (position.line === range.end.line) {
                    return position.character <= range.end.character;
                }
                return true;
            }
        } else {
            return false;
        }
    }
}
