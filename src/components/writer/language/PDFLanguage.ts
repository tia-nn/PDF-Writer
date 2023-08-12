import { Monaco } from "@monaco-editor/react";
import { languages, editor, IRange } from "monaco-editor";
import MonarchLanguagePDF from "./monarch-language-pdf";

import parseWorker from "../../../worker/parse.worker?worker";
import { parse } from "flatted";
import { StreamDetector } from "../../../../parser/ast/StreamDetector";
import { StreamNode } from "../../../../parser/ast/ast/stream";
import { StartNode } from "../../../../parser/ast/ast/start";
import { Ascii85Encode } from "../encoding/Ascii85";
import { buildEditOperation } from "../monaco/Build";


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

    const inputEl = document.getElementById('file-input') as HTMLInputElement;

    monaco.editor.addCommand({
        id: 'upload stream file',
        run: (ctx, model: editor.ITextModel, stream: StreamNode) => {
            inputEl.onchange = (e) => {
                if (inputEl.files && inputEl.files.length > 0) {
                    const f = inputEl.files[0];
                    const reader = new FileReader();
                    reader.onload = e => {
                        const buf = e.target?.result as ArrayBuffer;
                        const a85 = Ascii85Encode(new Uint8Array(buf));

                        const start = stream.v.main.src.position.start;
                        let end = 0;
                        if (stream.v.main.src.v.contentKEndStream) {
                            end = stream.v.main.src.position.stop;
                        } else {
                            end = stream.v.main.src.position.stop;
                        }
                        const diff = 'stream\n' + a85 + '\nendstream';

                        const codeEditor = monaco.editor.getEditors()[0];

                        const op = buildEditOperation(model, start, end, diff);
                        codeEditor.executeEdits(null, [op]);

                        // TODO: dict の /Filter と /Length を変更する
                    };
                    reader.readAsArrayBuffer(f);
                }
            };
            inputEl.click();
        }
    });

    monaco.languages.registerCodeLensProvider('pdf', {
        provideCodeLenses: (model, token) => {
            return new Promise(resolve => {
                const worker = new parseWorker();
                worker.onmessage = (e) => {
                    worker.terminate();
                    const [source, astStr] = e.data;
                    const ast = parse(astStr) as StartNode;
                    const streams = new StreamDetector().detect(ast);
                    const lenses: languages.CodeLens[] = [];
                    for (let i = 0; i < streams.length; i++) {
                        const s = streams[i];
                        const pos = model.getPositionAt(s.v.main.src.position.start);
                        lenses.push({
                            range: new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column),
                            command: {
                                title: 'upload file',
                                id: 'upload stream file',
                                arguments: [model, s],
                            }
                        });
                    }
                    resolve({
                        lenses: lenses,
                        dispose: () => { }
                    });
                };
                worker.postMessage(model.getValue());
            });
        }
    });
}
