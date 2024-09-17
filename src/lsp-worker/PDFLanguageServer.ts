import { InitializeResult } from "vscode-languageserver";
import { PDFLanguageParser } from "./PDFLanguageParser";
import { ParseResult } from "./types";
import {
    InitializeParams,
    Diagnostic,
    PublishDiagnosticsParams,
    DidOpenTextDocumentParams,
    DidChangeTextDocumentParams,
} from "vscode-languageserver-protocol";


export class PDFLanguageServer {
    onDiagnostic: (params: PublishDiagnosticsParams) => void;
    parsing_: Promise<ParseResult> | null = null;
    parseReject: (() => void) | null;

    get parsing(): Promise<ParseResult> | null {
        return this.parsing_;
    }

    set parsing(value: Promise<ParseResult>) {
        this.parsing_ = value;
        value.then((result) => {
            this.diagnostic(result);
        });
    }

    constructor(onDiagnostic: (params: PublishDiagnosticsParams) => void) {
        this.onDiagnostic = onDiagnostic;
        this.parseReject = null;
    }

    async initialize(params: InitializeParams): Promise<InitializeResult> {
        return {
            capabilities: {},
        }
    }

    async diagnostic(result: ParseResult) {
        this.onDiagnostic({
            uri: "",
            diagnostics: result.diagnostic,
        })
    }

    async didOpenTextDocument(params: DidOpenTextDocumentParams) {
        this.parsing = new Promise(async (resolve, reject) => {
            this.parseReject?.();
            this.parseReject = reject;
            resolve(PDFLanguageParser.parse(params.textDocument.text))
        });
    }

    async didChangeTextDocument(params: DidChangeTextDocumentParams) {
        this.parsing = new Promise(async (resolve, reject) => {
            this.parseReject?.();
            this.parseReject = reject;
            resolve(PDFLanguageParser.parse(params.contentChanges[0]?.text))
        });
    }

}
