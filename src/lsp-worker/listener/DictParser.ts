import { DictEntryNode, DictNode, DictTokenType, RuleIndex } from "../types";
import PDFParser, { DictionaryContext, NameContext, ObjectContext, StreamContext, TrailerContext } from "../antlr/dist/PDFParser";
import { BasePDFParserListener, N, TreeTools } from "./BasePDFParserListener";
import { DictType, DICT_TYPE, DictDefinitions } from '@/tools/dictTyping';


export class DictParser extends BasePDFParserListener {
    inTrailer: boolean = false;
    inStream: boolean = false;
    dictionaries: DictNode[] = [];

    public result(): DictNode[] {
        return this.dictionaries;
    }

    exitDictionary: ((ctx: DictionaryContext) => void) = (ctx) => {
        const entries = ctx.dictionary_entry_list();

        const entiresNode: DictEntryNode[] = [];
        let dictType: DictType =
            this.inTrailer ? "trailer"
                : this.inStream
                    ? "stream"
                    : "unknown";
        let dictSubType: string | null = null;
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

            entiresNode.push({ name: name || undefined, value: value || undefined });

            const nameStr = name ? TreeTools.parseName(name) : null;

            // /Type がある場合は dictType を決定
            if (dictType === "unknown" && nameStr === "/Type" && valueIsName) {
                const valueStr = TreeTools.parseName(valueChild as NameContext);
                if ((DICT_TYPE as ReadonlyArray<string>).includes(valueStr)) {
                    dictType = valueStr as DictType;
                }
            }
            if (dictSubType === null && nameStr === "/Subtype" && valueIsName) {
                dictSubType = TreeTools.parseName(valueChild as NameContext);
            }
        }

        if (dictType !== "unknown" && dictSubType !== null) {
            const definition = DictDefinitions[dictType];
            const subtypeEnum = definition["/Subtype"]?.enum;
            if (subtypeEnum && Object.keys(subtypeEnum).includes(dictSubType)) {
                dictType = dictType + "-" + dictSubType as DictType;
            }
        }

        this.dictionaries.push({
            range: TreeTools.range(ctx),
            type: dictType,
            entries: entiresNode,
            open: ctx.DICT_OPEN(),
            close: ctx.DICT_CLOSE() || undefined,
        })
    };

    enterTrailer: ((ctx: TrailerContext) => void) = (ctx) => {
        this.inTrailer = true;
    };

    exitTrailer: ((ctx: TrailerContext) => void) = (ctx) => {
        this.inTrailer = false;
    };

    enterStream: ((ctx: StreamContext) => void) = (ctx) => {
        this.inStream = true;
    }

    exitStream: ((ctx: StreamContext) => void) = (ctx) => {
        this.inStream = false;
    }
}
