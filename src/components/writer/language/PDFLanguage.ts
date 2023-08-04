import { Monaco } from "@monaco-editor/react";
import { languages } from "monaco-editor";
import MonarchLanguagePDF from "./monarch-language-pdf";


export function registerLanguagePDF(monaco: Monaco) {
    monaco.languages.register({ id: 'pdf' });
    monaco.languages.setMonarchTokensProvider('pdf', MonarchLanguagePDF);
    // monaco.languages.registerCompletionItemProvider('pdf', {
    //     triggerCharacters: ['/'],
    //     provideCompletionItems: (model, position, context, token) => {
    //         console.log('aaa');
    //         var word = model.getWordUntilPosition(position);
    //         var wordPrefix = model.getValueInRange({
    //             startLineNumber: position.lineNumber,
    //             startColumn: word.startColumn - 1,
    //             endLineNumber: position.lineNumber,
    //             endColumn: word.startColumn
    //         });
    //         if (wordPrefix === '/') {

    //             var range = {
    //                 startLineNumber: position.lineNumber,
    //                 startColumn: word.startColumn - 1,
    //                 endLineNumber: position.lineNumber,
    //                 endColumn: word.endColumn,
    //             };

    //             return {
    //                 suggestions: [
    //                     {
    //                         label: '/Font',
    //                         kind: monaco.languages.CompletionItemKind.Value,
    //                         documentation: "the name /Font.",
    //                         insertText: '/Font',
    //                         range: range,
    //                     },
    //                 ]
    //             };
    //         }
    //         return {
    //             suggestions: [
    //             ]
    //         };
    //     }
    // });
}
