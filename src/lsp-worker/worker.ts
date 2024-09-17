import { PDFLanguageServer } from "./PDFLanguageServer";
import { RequestMessage, ResponseMessage, NotificationMessage } from "vscode-languageserver-protocol";

function onDiagnostic(params: any) {
    postMessage({
        jsonrpc: "2.0",
        method: "textDocument/publishDiagnostics",
        params: params
    } as NotificationMessage);
}

const server = new PDFLanguageServer(onDiagnostic);

onmessage = function (e: MessageEvent<RequestMessage>) {
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
        }
    }).then((result) => {
        if (request.id == null) return; // notification
        postMessage({
            jsonrpc: "2.0",
            id: request.id,
            result: result
        } as ResponseMessage);
    }).catch((error) => {
        postMessage({
            jsonrpc: "2.0",
            id: request.id,
            error: {
                code: -32000,
                message: error.message
            }
        } as ResponseMessage);
    });
}
