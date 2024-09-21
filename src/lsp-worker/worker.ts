import { PDFLanguageServer } from "./PDFLanguageServer";
import * as lsp from "vscode-languageserver-protocol";

function onDiagnostic(params: any) {
    postMessage({
        jsonrpc: "2.0",
        method: "textDocument/publishDiagnostics",
        params: params
    } as lsp.NotificationMessage);
}

const server = new PDFLanguageServer(onDiagnostic);

onmessage = function (e: MessageEvent<lsp.RequestMessage>) {
    const request = e.data;

    new Promise(async (resolve, reject) => {
        switch (request.method) {
            case "initialize":
                resolve(await server.initialize(request.params as any));
                break;
            case "textDocument/didOpen":
                server.didOpenTextDocument(request.params as any);
                resolve(null);
                break;
            case "textDocument/didChange":
                server.didChangeTextDocument(request.params as any);
                resolve(null);
                break;
            case "textDocument/completion":
                resolve(await server.completion(request.params as any));
                break;
        }
    }).then((result) => {
        if (request.id == null) return; // notification
        postMessage({
            jsonrpc: "2.0",
            id: request.id,
            result: result
        } as lsp.ResponseMessage);
    }).catch((error) => {
        postMessage({
            jsonrpc: "2.0",
            id: request.id,
            error: {
                code: -32000,
                message: error.message
            } as lsp.ResponseError
        } as lsp.ResponseMessage);
    });
}
