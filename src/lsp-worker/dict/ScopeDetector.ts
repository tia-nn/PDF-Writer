import { DictNode, RangeIndex, Scope } from "../types";
import PDFParser, { NameContext } from "../antlr/dist/PDFParser";
import * as lsp from "vscode-languageserver-protocol";
import { BasePDFParserListener, N, Positional, TreeTools } from "../listener/BasePDFParserListener";
import { isInRange } from "@/tools/lspTools";

export class ScopeDetector {
    public static getScope(dictionaries: DictNode[], position: lsp.Position): Scope | null {
        for (const dict of dictionaries) {
            let lastToken: Positional = dict.open;
            let pastValueIsMissing: boolean = false;
            for (const e of dict.entries) {
                let nameRange: RangeIndex;
                let valueRange: RangeIndex | null;

                if (e.name) {
                    nameRange = TreeTools.betweenRange(lastToken, e.name, false, true);
                    if (e.value) {
                        valueRange = TreeTools.betweenRange(e.name, e.value, false, true);
                    } else {
                        // value がない場合、末尾にしか現れないのでループ外で処理
                        valueRange = null;
                        pastValueIsMissing = true;
                    }
                } else {
                    // name がない場合
                    const value = e.value!; // name がない場合は value は必ず存在する
                    nameRange = TreeTools.betweenRangeExclude(lastToken, value);
                    valueRange = TreeTools.range(value);
                }

                if (isInRange(nameRange, position)) {
                    return {
                        kind: "dict-key",
                        dictType: dict.type,
                        have: dict.entries.map(e => e.name && TreeTools.parseName(e.name)).filter(e => e) as string[],
                    }
                } else if (valueRange && isInRange(valueRange, position)) {
                    return {
                        kind: "dict-value",
                        key: e.name ? TreeTools.parseName(e.name) : "unknown",
                        dictType: dict.type,
                    }
                }

                lastToken = e.value || e.name!;
            }

            // 最後のエントリから close までの処理
            if (dict.close) { // close がない場合は考慮しない
                if (pastValueIsMissing) {
                    // 末尾の name から close までの範囲
                    const nameRange = TreeTools.betweenRangeExclude(lastToken, dict.close);
                    if (isInRange(nameRange, position)) {
                        return {
                            kind: "dict-value",
                            key: TreeTools.parseName(lastToken as NameContext),
                            dictType: dict.type,
                        }
                    }
                } else {
                    // 末尾の value から close までの範囲
                    const valueRange = TreeTools.betweenRangeExclude(lastToken, dict.close);
                    if (isInRange(valueRange, position)) {
                        return {
                            kind: "dict-key",
                            dictType: dict.type,
                            have: dict.entries.map(e => e.name && TreeTools.parseName(e.name)).filter(e => e) as string[],
                        }
                    }
                }
            }
        }
        return null;
    }
}
