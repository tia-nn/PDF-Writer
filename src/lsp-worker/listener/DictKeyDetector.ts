import antlr4, { ParserRuleContext, TerminalNode } from "antlr4";
import { DictKeyType, LocIndex, ParseResult, RangeIndex, RuleIndex, Scope } from "../types";
import PDFLexer from "../antlr/dist/PDFLexer";
import PDFParser, { BodyContext, DictionaryContext, Dictionary_entryContext, HeaderContext, Indirect_objContext, Indirect_refContext, IntegerContext, Invalid_codeContext, NameContext, ObjectContext, StartContext, StartxrefContext, StreamContext, TrailerContext, XrefContext } from "../antlr/dist/PDFParser";
import PDFParserListener from "../antlr/dist/PDFParserListener";
import * as lsp from "vscode-languageserver-protocol";
import { TokenWithEndPos } from "../antlr/lib";
import { BasePDFParserListener, N } from "./BasePDFParserListener";
import { DictType, DICT_TYPE } from '@/tools/dictTyping';


export class DictKeyDetector extends BasePDFParserListener {
    key: DictKeyType | null = null;
    inTrailer: boolean = false;
    position: lsp.Position;

    constructor(position: lsp.Position) {
        super();
        this.position = position;
    }

    public result(): DictKeyType | null {
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
        for (const entry of entries) {
            const nameOrNull = entry.name() as N<NameContext>;
            const value = entry.object().getChild(0) as RuleIndex;
            const valueIsName = value.ruleIndex === PDFParser.RULE_name;

            // /Type がある場合は dictType を決定
            const nameStr = nameOrNull && this.parseName(nameOrNull);
            if (dictType === "unknown" && nameStr === "/Type" && valueIsName) {
                const valueStr = this.parseName(value as NameContext);
                if ((DICT_TYPE as ReadonlyArray<string>).includes(valueStr)) {
                    dictType = valueStr as DictType;
                }
            }

            // 現在位置が name の範囲内なら key として記録
            const name = nameOrNull || (valueIsName ? value as NameContext : null);
            if (name && this.isInRange(this.range(name), this.position)) {
                inRangeKey = this.parseName(name);
            }
        }
        if (inRangeKey) {
            this.key = {
                dictType: dictType,
                key: inRangeKey,
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
