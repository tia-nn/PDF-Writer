import { languages, editor, Selection, Position } from "monaco-editor";
import { ScopeKindDict } from "./scope";


export function suggestTrailerDict(scope: ScopeKindDict, position: Position, wordRange: editor.IWordAtPosition, wordPrefix: string): languages.CompletionItem[] {

    if (scope.state.kind == "key") {
        const nameRange = {
            startLineNumber: position.lineNumber,
            startColumn: wordPrefix == '/' ? wordRange.startColumn - 1 : wordRange.startColumn,
            endLineNumber: position.lineNumber,
            endColumn: wordRange.endColumn,
        };

        const keys = ['Size', 'Prev', 'Root', 'Encrypt', 'Info', 'ID'];
        const existKeys = Object.keys(scope.node.v.contents.srcObj);
        const suggest = keys.filter(k => existKeys.indexOf(k) == -1);
        return suggest.map(t => ({
            label: '/' + t,
            kind: languages.CompletionItemKind.Value,
            insertText: '/' + t,
            range: nameRange,
        }));
    }

    return [];
}
