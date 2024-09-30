import { DictNode, DictTokenType, RuleIndex } from "../types";
import PDFParser, { NameContext } from "../antlr/dist/PDFParser";
import * as lsp from "vscode-languageserver-protocol";
import { BasePDFParserListener, N, TreeTools } from "../listener/BasePDFParserListener";
import { isInRange } from "@/tools/lspTools";

export class DictKeyDetector extends BasePDFParserListener {
    public static getDictNameElement(dictionaries: DictNode[], position: lsp.Position): DictTokenType | null {
        for (const dict of dictionaries) {
            for (const entry of dict.entries) {
                const valueChild = entry.value?.getChild(0) as RuleIndex;
                const valueAsName = valueChild.ruleIndex === PDFParser.RULE_name ? valueChild as NameContext : null;
                if (entry.name && isInRange(TreeTools.range(entry.name), position)) {
                    return {
                        type: "dict-key",
                        dictType: dict.type,
                        key: TreeTools.parseName(entry.name),
                    }
                }
                if (entry.name && valueAsName && isInRange(TreeTools.range(valueAsName), position)) {
                    return {
                        type: "dict-value",
                        dictType: dict.type,
                        key: TreeTools.parseName(entry.name),
                        valueName: TreeTools.parseName(valueAsName),
                    }
                }
            }
        }
        return null;
    }
}
