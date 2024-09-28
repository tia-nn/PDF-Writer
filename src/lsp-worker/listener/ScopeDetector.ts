import { ParserRuleContext, TerminalNode } from "antlr4";
import { RangeIndex, RuleIndex, Scope } from "../types";
import PDFParser, { DictionaryContext, NameContext, TrailerContext } from "../antlr/dist/PDFParser";
import * as lsp from "vscode-languageserver-protocol";
import { BasePDFParserListener, N } from "./BasePDFParserListener";
import { DictType, DICT_TYPE, DictDefinitions } from '@/tools/dictTyping';


export class ScopeDetector extends BasePDFParserListener {
    scope: Scope | null = null;
    inTrailer: boolean = false;
    position: lsp.Position;

    constructor(position: lsp.Position) {
        super();
        this.position = position;
    }

    public result(): Scope | null {
        return this.scope;
    }

    exitDictionary?: ((ctx: DictionaryContext) => void) = (ctx) => {
        if (this.scope) return;

        const open = ctx.DICT_OPEN();
        const close = ctx.DICT_CLOSE() as N<TerminalNode>;

        const range = this.range(ctx);
        const innerRange: RangeIndex = {
            start: {
                line: range.start.line,
                character: range.start.character + 2,
                index: range.start.index + 2,
            },
            end: {
                line: range.end.line,
                character: range.end.character + (close ? - 2 : 0),
                index: range.end.index + (close ? - 2 : 0),
            },
        }
        if (!this.isInRange(innerRange, this.position)) {
            return;
        }

        const entries = ctx.dictionary_entry_list();

        const names: string[] = [];
        let dictType: DictType = this.inTrailer ? "trailer" : "unknown";
        let dictSubType: string | null = null;
        for (const entry of entries) {
            const name = entry.name() as N<NameContext>;
            const value = entry.object();
            const valueIsName = (value.getChild(0) as RuleIndex).ruleIndex === PDFParser.RULE_name;
            if (name) {
                names.push(name.getText());
            } else if (valueIsName) {
                names.push((value.getChild(0) as NameContext).getText());
            }

            const nameStr = name && this.parseName(name);
            if (dictType === "unknown" && nameStr === "/Type" && valueIsName) {
                const valueStr = this.parseName(value.getChild(0) as NameContext);
                if ((DICT_TYPE as ReadonlyArray<string>).includes(valueStr)) {
                    dictType = valueStr as DictType;
                }
            }
            if (dictSubType === null && nameStr === "/Subtype" && valueIsName) {
                dictSubType = this.parseName(value.getChild(0) as NameContext);
            }
        }

        if (dictType !== "unknown" && dictSubType !== null) {
            const definition = DictDefinitions[dictType];
            const subtypeEnum = definition["/Subtype"]?.enum;
            if (subtypeEnum && Object.keys(subtypeEnum).includes(dictSubType)) {
                dictType = dictType + "-" + dictSubType as DictType;
            }
        }

        let lastToken: ParserRuleContext | TerminalNode = open;
        let missingLastValue: boolean = false
        for (const entry of entries) {
            const name: N<NameContext> = entry.name();
            const value = entry.object();

            if (name === null) {
                if ((value.getChild(0) as RuleIndex).ruleIndex === PDFParser.RULE_name) {
                    // value がない場合。末尾にしか現れない

                    // 前の value から name までの範囲
                    if (this.isInRange(this.betweenRange(lastToken, value, false, true), this.position)) {
                        this.scope = {
                            kind: "dict-key",
                            dictType: dictType,
                            have: names,
                        }
                        return;
                    }
                    missingLastValue = true;
                } else {
                    // name がない場合

                    // 前の value から value 手前までの範囲
                    if (this.isInRange(this.betweenRangeExclude(lastToken, value), this.position)) {
                        this.scope = {
                            kind: "dict-key",
                            dictType: dictType,
                            have: names,
                        }
                        return;
                    }
                    // value の範囲
                    if (this.isInRange(this.range(value), this.position)) {
                        this.scope = {
                            kind: "dict-value",
                            key: "unknown",
                            dictType: dictType,
                        }
                        return;
                    }
                }
            } else {
                // 手前の value から name までの範囲
                if (this.isInRange(this.betweenRange(lastToken, name, false, true), this.position)) {
                    this.scope = {
                        kind: "dict-key",
                        dictType: dictType,
                        have: names,
                    }
                    return;
                }
                // name から value までの範囲
                if (this.isInRange(this.betweenRange(name, value, false, true), this.position)) {
                    this.scope = {
                        kind: "dict-value",
                        key: name.getText(),
                        dictType: dictType,
                    }
                    return;
                }
            }
            lastToken = value;
        }

        // 最後のエントリから close までの処理
        if (close) {
            if (missingLastValue) {
                // 末尾の name から close までの範囲
                if (this.isInRange(this.betweenRangeExclude(lastToken, close), this.position)) {
                    this.scope = {
                        kind: "dict-value",
                        key: (lastToken as NameContext).getText(),
                        dictType: dictType,
                    };
                    return;
                }
            } else {
                // 末尾の value から close までの範囲
                if (this.isInRange(this.betweenRangeExclude(lastToken, close), this.position)) {
                    this.scope = {
                        kind: "dict-key",
                        dictType: dictType,
                        have: names,
                    };
                    return;
                }
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
        // position はすでにパースされたものからさらに1文字入力した位置になるので1文字ずらす
        const shiftedPosition = {
            line: position.line,
            character: position.character - 1,
        }

        if (range.start.line <= shiftedPosition.line && shiftedPosition.line <= range.end.line) {
            if (range.start.line === range.end.line) {
                return range.start.character <= shiftedPosition.character && shiftedPosition.character <= range.end.character
            } else {
                if (range.start.line === shiftedPosition.line) {
                    return range.start.character <= shiftedPosition.character;
                }
                if (shiftedPosition.line === range.end.line) {
                    return shiftedPosition.character <= range.end.character;
                }
                return true;
            }
        } else {
            return false;
        }
    }
}
