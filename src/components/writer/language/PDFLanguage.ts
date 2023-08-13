import { Monaco } from "@monaco-editor/react";
import { languages, editor } from "monaco-editor";
import MonarchLanguagePDF from "./monarch-language-pdf";

import parseWorker from "../../../worker/parse.worker?worker";
import { parse } from "flatted";
import { StreamDetector } from "./parser/ast/StreamDetector";
import { StreamNode } from "./parser/ast/ast/stream";
import { StartNode } from "./parser/ast/ast/start";
import { Ascii85Encode } from "../encoding/Ascii85";
import { buildEditOperation } from "../monaco/Build";
import { ScopeDetector } from "./completion/ScopeDetector";
import { suggestTrailerDict } from "./completion/dict-suggest";
import { buildXrefTable } from "./AutoFill";


export function registerLanguagePDF(monaco: Monaco) {
    monaco.languages.register({ id: 'pdf' });
    monaco.languages.setMonarchTokensProvider('pdf', MonarchLanguagePDF);

    monaco.languages.registerCompletionItemProvider('pdf', {
        triggerCharacters: ['/'],
        provideCompletionItems: (model, position, context, token) => {

            return new Promise(resolve => {
                const worker = new parseWorker();
                worker.onmessage = (e) => {
                    worker.terminate();
                    const [source, astStr] = e.data;
                    if (source == undefined) return resolve({ suggestions: [] });
                    const ast = parse(astStr) as StartNode;

                    const word = model.getWordUntilPosition(position);
                    const wordPrefix = model.getValueInRange({
                        startLineNumber: position.lineNumber,
                        startColumn: word.startColumn - 1,
                        endLineNumber: position.lineNumber,
                        endColumn: word.startColumn
                    });

                    const p = model.getOffsetAt(position);
                    const scope = new ScopeDetector().detect(ast, p);

                    if (scope.kind == "dict" && scope.inTrailer) {
                        resolve({
                            suggestions: suggestTrailerDict(scope, position, word, wordPrefix),
                            // suggestions: [],
                        });
                    } else resolve({ suggestions: [] });
                };
                worker.postMessage(model.getValue());
            });
        }
    });

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

    monaco.editor.addCommand({
        id: 'auto fill xref table',
        run: (ctx, model: editor.ITextModel, ast: StartNode) => {
            if (model) {
                const xref = buildXrefTable(ast);
                if (xref) {
                    const codeEditor = monaco.editor.getEditors()[0];
                    const op = buildEditOperation(model, xref.start, xref.end, xref.text);
                    codeEditor.executeEdits(null, [op]);
                }
            }
        }
    });

    monaco.languages.registerCodeLensProvider('pdf', {
        provideCodeLenses: (model, token) => {
            return new Promise(resolve => {
                const worker = new parseWorker();
                worker.onmessage = (e) => {
                    worker.terminate();
                    const [source, astStr] = e.data;
                    if (source == undefined) return resolve({ lenses: [], dispose: () => { } });

                    const ast = parse(astStr) as StartNode;
                    const lenses: languages.CodeLens[] = [];

                    // upload stream file
                    const streams = new StreamDetector().detect(ast);
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

                    if (ast.v.xref && ast.v.xref.src.v.kXref && ast.v.trailer && ast.v.trailer.src.v.kTrailer) {
                        // auto fill xref table
                        const pos = model.getPositionAt(ast.v.xref.src.position.start);
                        lenses.push({
                            range: new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column),
                            command: {
                                title: 'auto complete',
                                id: 'auto fill xref table',
                                arguments: [model, ast],
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
