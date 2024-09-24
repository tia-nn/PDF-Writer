import { Monaco } from "@monaco-editor/react";
import { languages, editor, IPosition, IRange } from "monaco-editor";
import MonarchLanguagePDF from "./monarch-language-pdf";

import lspWorker from "../../../lsp-worker/worker?worker";
import * as lsp from "vscode-languageserver-protocol";
import { createMarkers } from "../monaco/Marker";
import { fromCompletionContext, fromPosition, toCodeLens, toCompletionItem, toDefinition, toLocation } from "monaco-languageserver-types";
import { Ascii85Encode, decodeUTF16BEA } from "@/tools/encoding";
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
                model && monaco.editor.setModelMarkers(model, 'pdf', createMarkers(params.diagnostics));
            }
            return;
        }
    };

    monaco.languages.registerCompletionItemProvider('pdf', {
        triggerCharacters: ['/', '%'],
        provideCompletionItems: (model, position, context, token) => {
            return new Promise(resolve => {
                const ret: languages.CompletionItem[] = [];
                const wordAt = model.getWordAtPosition(position);
                const leadChar = model.getValueInRange(new monaco.Range(position.lineNumber, position.column - 1, position.lineNumber, position.column));

                let backColumn = leadChar === '/' ? - 1 : 0;
                const range = wordAt
                    ? new monaco.Range(position.lineNumber, wordAt.startColumn + backColumn, position.lineNumber, wordAt.endColumn)
                    : new monaco.Range(position.lineNumber, position.column + backColumn, position.lineNumber, position.column);

                ret.push(...completionComments(model, position, context));

                commandGetScope(position).then(scope => {
                    scope && ret.push(...completionDict(model, position, context, scope));

                    console.log(ret);
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
