import { Monaco } from "@monaco-editor/react";
import { languages, editor, IPosition, IRange } from "monaco-editor";
import * as monaco from "monaco-editor";
import MonarchLanguagePDF from "./monarch-language-pdf";

import lspWorker from "../../../lsp-worker/worker?worker";
import * as lsp from "vscode-languageserver-protocol";
import { fromCompletionContext, fromLocation, fromPosition, toCodeLens, toCompletionItem, toDefinition, toHover, toLocation, toMarkerData, toPosition, toRange, toTextEdit } from "monaco-languageserver-types";
import { Ascii85Encode } from "@/tools/encoding";
import { Scope } from "@/lsp-worker/types";
import { completionComments, completionDict } from "./completion";


let server: Worker;
let lspRequestID = 0;

const ResponseQueue: { [key: number]: (result: any) => void } = {};

export function registerLanguagePDF(monaco: Monaco, editor: editor.IStandaloneCodeEditor) {
    monaco.languages.register({ id: 'pdf' });
    monaco.languages.setMonarchTokensProvider('pdf', MonarchLanguagePDF);
    monaco.languages.setLanguageConfiguration('pdf', {
        comments: {
            lineComment: '%'
        },
        brackets: [
            ['[', ']'],
            ['(', ')'],
            ['<', '>'],
            ['<<', '>>'],
        ],
        autoClosingPairs: [
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '<', close: '>' },
        ],
        surroundingPairs: [
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '<', close: '>' },
        ],
        colorizedBracketPairs: [
            ['[', ']'],
            ['<<', '>>'],
        ],
        onEnterRules: [
            {
                beforeText: /\/(\/*)$/,
                action: { indentAction: monaco.languages.IndentAction.Indent }
            }
        ]
    });
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.F12, function () {
        editor.trigger('keyboard', 'editor.action.referenceSearch.trigger', {});
    });
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.F2, function () {

        monaco.editor.getEditors().forEach(e => {
            console.log(e);
        })
    });

    server?.terminate()
    server = new lspWorker();

    server.postMessage({
        jsonrpc: '2.0',
        id: lspRequestID++,
        method: 'initialize',
        params: {} as lsp.InitializeParams,
    } as lsp.RequestMessage);

    server.onmessage = (e: MessageEvent<lsp.Message>) => {
        const message = e.data;
        if ((message as lsp.RequestMessage).method != null && (message as lsp.RequestMessage).id != null) {
            // request
            const request = message as lsp.RequestMessage;
            return;
        } else if ((message as lsp.ResponseMessage).id != null) {
            // response
            const response = message as lsp.ResponseMessage;
            const reqID = parseInt(String(response.id));
            const callback = ResponseQueue[reqID];
            if (callback) {
                callback(response.result);
                delete ResponseQueue[reqID];
            }
            return;
        }
        else if ((message as lsp.NotificationMessage).method != null) {
            // notification
            const notification = message as lsp.NotificationMessage;
            if (notification.method == 'textDocument/publishDiagnostics') {
                const params = notification.params as lsp.PublishDiagnosticsParams;
                const model = editor.getModel();
                model && monaco.editor.setModelMarkers(model, 'pdf', params.diagnostics.map(toMarkerData));
            }
            return;
        }
    };

    monaco.languages.registerCompletionItemProvider('pdf', {
        triggerCharacters: ['/', '%'],
        provideCompletionItems: (model, position, context, token) => {
            return new Promise(resolve => {
                const ret: languages.CompletionItem[] = [];

                ret.push(...completionComments(model, position, context));

                const shiftedPosition = {
                    lineNumber: position.lineNumber,
                    column: position.column - 1,
                };
                commandGetScope(shiftedPosition).then(scope => {
                    scope && ret.push(...completionDict(model, position, context, scope));

                    resolve({
                        suggestions: ret,
                    });
                });
            });
        }
    });

    monaco.languages.registerDefinitionProvider('pdf', {
        provideDefinition: (model, position, token) => {
            return new Promise(resolve => {
                const reqId = lspRequestID++;

                ResponseQueue[reqId] = (result: lsp.Location | null) => {
                    resolve(result ? toDefinition(result) : []);
                };

                send(reqId, 'textDocument/definition', {
                    textDocument: {
                        uri: "file://main.pdf",
                    },
                    position: fromPosition(position),
                } as lsp.DefinitionParams);
            });
        }
    });

    monaco.languages.registerReferenceProvider('pdf', {
        provideReferences: (model, position, context, token) => {
            return new Promise(resolve => {
                const reqId = lspRequestID++;

                ResponseQueue[reqId] = (result: lsp.Location[]) => {
                    resolve(result.map(toLocation));
                };

                send(reqId, 'textDocument/references', {
                    textDocument: {
                        uri: "file://main.pdf",
                    },
                    position: fromPosition(position),
                    context: {
                        includeDeclaration: true,
                    },
                } as lsp.ReferenceParams);
            });
        }
    });

    monaco.languages.registerCodeLensProvider('pdf', {
        provideCodeLenses: (model, token) => {
            return new Promise(resolve => {
                const reqId = lspRequestID++;

                ResponseQueue[reqId] = (result: lsp.CodeLens[]) => {
                    resolve({
                        lenses: result.map(toCodeLens),
                        dispose: () => { }
                    });
                };

                server.postMessage({
                    jsonrpc: '2.0',
                    id: reqId,
                    method: 'textDocument/codeLens',
                    params: {
                        textDocument: {
                            uri: "file://main.pdf",
                        },
                    } as lsp.CodeLensParams,
                } as lsp.RequestMessage);

            });
        }
    });

    monaco.languages.registerHoverProvider('pdf', {
        provideHover: (model, position, token) => {
            return new Promise(resolve => {
                const reqId = lspRequestID++;

                ResponseQueue[reqId] = (result: lsp.Hover | null) => {
                    resolve(result ? toHover(result) : null);
                };

                send(reqId, 'textDocument/hover', {
                    textDocument: {
                        uri: "file://main.pdf",
                    },
                    position: fromPosition(position),
                } as lsp.HoverParams);
            });
        }
    });

    const inputEl = document.getElementById('file-input') as HTMLInputElement;

    monaco.editor.addCommand({
        id: 'pdf.uploadFile',
        run: (command: lsp.Command, loc: lsp.Location) => {
            inputEl.onchange = (e) => {
                if (inputEl.files && inputEl.files.length > 0) {
                    const f = inputEl.files[0];
                    const reader = new FileReader();
                    reader.onload = e => {
                        const buf = e.target?.result as ArrayBuffer;
                        const a85 = Ascii85Encode(new Uint8Array(buf));

                        const diff = 'stream\n' + a85 + '\nendstream';

                        const p = toLocation(loc)
                        const op: editor.ISingleEditOperation = {
                            range: p.range,
                            text: diff,
                            // forceMoveMarkers: true,
                        };
                        editor.executeEdits(null, [op]);

                        // TODO: dict の /Filter と /Length を変更する
                    };
                    reader.readAsArrayBuffer(f);
                    inputEl.value = '';
                }
            };
            inputEl.click();
        }
    });

    monaco.editor.addCommand({
        id: 'pdf.insertXRefTable',
        run: (command: lsp.Command, loc: lsp.Location) => {
            commandInsertXRefTable().then(textEdit => {
                if (textEdit) {
                    editor.executeEdits(null, [toTextEdit(textEdit)]);
                }
            });
        }
    });

    monaco.editor.addCommand({
        id: 'pdf.peekStreamContents',
        run: (command: lsp.Command, loc: lsp.Location) => {
            const uri = monaco.Uri.parse(loc.uri);
            const model = monaco.editor.getModel(uri);
            if (!model) return;
            const contents = model.getValueInRange(toRange(loc.range));
            const streamModel = monaco.editor.createModel(contents, 'pdf-stream', monaco.Uri.parse('file://main.pdf?stream'));
            const position = toPosition(loc.range.start);
            const location: languages.Location = {
                uri: monaco.Uri.parse("file://main.pdf?stream"),
                range: new monaco.Range(1, 1, 1, 1),
            };
            peekLocations(editor, uri, position, [location]);

            monaco.editor.getEditors().forEach(e => {
                console.log(e);
            })
        }
    })
}

export function didOpenTextDocument(text: string) {
    server?.postMessage({
        jsonrpc: '2.0',
        method: 'textDocument/didOpen',
        params: {
            textDocument: {
                uri: "file://main.pdf",
                languageId: 'pdf',
                version: 1,
                text: text,
            }
        } as lsp.DidOpenTextDocumentParams,
    } as lsp.NotificationMessage);
}

export function didChangeTextDocument(text: string) {
    server?.postMessage({
        jsonrpc: '2.0',
        method: 'textDocument/didChange',
        params: {
            textDocument: {
                uri: "file://main.pdf",
                version: 2,
            },
            contentChanges: [{
                text: text,
            }]
        } as lsp.DidChangeTextDocumentParams,
    } as lsp.NotificationMessage);
}

function send(reqID: number, method: string, params: any) {
    server?.postMessage({
        jsonrpc: '2.0',
        id: reqID,
        method: method,
        params: params
    } as lsp.RequestMessage);
}

export async function commandEncodeTextString(): Promise<SharedArrayBuffer> {
    return new Promise((resolve) => {
        const reqId = lspRequestID++;

        ResponseQueue[reqId] = ({ buffer }: { buffer: SharedArrayBuffer }) => {
            resolve(buffer);
        };

        server?.postMessage({
            jsonrpc: '2.0',
            id: reqId,
            method: 'workspace/executeCommand',
            params: {
                command: 'pdf.encodeTextString',
                arguments: [],
            } as lsp.ExecuteCommandParams,
        } as lsp.RequestMessage);
    }) || new SharedArrayBuffer(0);
}

export async function commandGetScope(position: IPosition): Promise<Scope | null> {
    return new Promise((resolve) => {
        const reqId = lspRequestID++;

        ResponseQueue[reqId] = ({ scope }: { scope: Scope | null }) => {
            resolve(scope);
        };

        server?.postMessage({
            jsonrpc: '2.0',
            id: reqId,
            method: 'workspace/executeCommand',
            params: {
                command: 'pdf.getScope',
                arguments: [fromPosition(position)],
            } as lsp.ExecuteCommandParams,
        } as lsp.RequestMessage);
    }) || new SharedArrayBuffer(0);
}

async function commandInsertXRefTable(): Promise<lsp.TextEdit | null> {
    return new Promise((resolve) => {
        const reqId = lspRequestID++;

        ResponseQueue[reqId] = (textEdit: lsp.TextEdit | null) => {
            resolve(textEdit);
        };

        server?.postMessage({
            jsonrpc: '2.0',
            id: reqId,
            method: 'workspace/executeCommand',
            params: {
                command: 'pdf.insertXRefTable',
                arguments: [],
            } as lsp.ExecuteCommandParams,
        } as lsp.RequestMessage);
    });
}

function peekLocations(editor: monaco.editor.IStandaloneCodeEditor, uri: monaco.Uri, position: monaco.IPosition, location: languages.Location[]) {
    // editor.trigger() が複数の引数を使えないため StandaloneCodeEditor の private _commandService にアクセスする
    // NOTE: @monaco-editor/react は古いバージョンの monaco-editor を使っており、これを廃止して最新の monaco-editor を使うなら現状を確認する
    // https://github.com/microsoft/vscode/blob/9bfaf90fb9a479c16c6a33052efb3c9b188f03cb/src/vs/editor/browser/widget/codeEditor/codeEditorWidget.ts#L225
    (editor as any)._commandService.executeCommand('editor.action.peekLocations', uri, position, location);
}
