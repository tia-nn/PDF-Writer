import { DictType, Scope } from "@/lsp-worker/types";
import * as monaco from "monaco-editor";

const keywords = [
    "obj",
    "endobj",
    "xref",
    "trailer",
    "startxref",
]

const literalKeywords = [
    "true",
    "false",
    "null",
]

export function completionComments(model: monaco.editor.ITextModel, position: monaco.IPosition, context: monaco.languages.CompletionContext): monaco.languages.CompletionItem[] {
    const ret = []
    // header
    if (position.lineNumber === 1) {
        const lineLength = model.getLineLength(1)
        ret.push({
            label: "%PDF-1.0",
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: "%PDF-1.0",
            range: new monaco.Range(1, 1, 1, lineLength + 1),
        })
    }

    // %%EOF
    if (context.triggerCharacter === "%") {
        if (context.triggerCharacter === '%') {
            const head = model.getLineContent(position.lineNumber).slice(0, 2);
            if (position.column === 2 || position.column === 3 && head === '%%') { // 行頭 %%
                ret.push({
                    label: '%%EOF',
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: '%%EOF',
                    range: new monaco.Range(position.lineNumber, 1, position.lineNumber, position.column),
                })
            }

        }
    }
    return ret;
}

const items: { [key in DictType]: { keys: string[], values: { [key: string]: string[] | undefined } } } = {
    "unknown": {
        keys: ["/Type"],
        values: {
            "/Type": ["/Catalog", "/Pages", "/Page", "/Font"]
        }
    },
    "trailer": { keys: ["/Root", "/Size", "/Prev", "/Info"], values: {} },
    "/Catalog": {
        keys: ["/Pages", "/Outlines", "/PageMode"], values: {
            "/Pages": [],
            "/Outlines": [],
            "/PageMode": ["/UseNone", "/UseOutlines", "/UseThumbs"],
        }
    },
}

export function completionDict(model: monaco.editor.ITextModel, position: monaco.IPosition, context: monaco.languages.CompletionContext, scope: Scope): monaco.languages.CompletionItem[] {
    const ret = []
    const wordAt = model.getWordAtPosition(position);
    const leadChar = model.getValueInRange(new monaco.Range(position.lineNumber, position.column - 1, position.lineNumber, position.column));
    const rollbackRange = leadChar === '/' ? 1 : 0;
    let range = wordAt
        ? new monaco.Range(position.lineNumber, wordAt.startColumn - rollbackRange, position.lineNumber, wordAt.endColumn)
        : new monaco.Range(position.lineNumber, position.column - rollbackRange, position.lineNumber, position.column);

    if (scope.kind === 'dict-key') {
        console.log("dict-key", scope)
        const keys = items[scope.dictType].keys.filter(item => !scope.have.includes(item));
        ret.push(...keys.map(item => ({
            label: item,
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: item,
            range: range,
        })))
    } else if (scope.kind === 'dict-value') {
        const keys = items[scope.dictType].values[scope.key] || [];
        ret.push(...keys.map(item => ({
            label: item,
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: item,
            range: range,
        })))
    }

    return ret;
}
