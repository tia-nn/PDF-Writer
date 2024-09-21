import { PDFLanguageParser } from "./PDFLanguageParser";
import { ParseResult, Scope } from "./types";
import * as lsp from "vscode-languageserver-protocol";


export class PDFLanguageServer {
    onDiagnostic: (params: lsp.PublishDiagnosticsParams) => void;
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

    constructor(onDiagnostic: (params: lsp.PublishDiagnosticsParams) => void) {
        this.onDiagnostic = onDiagnostic;
        this.parseReject = null;
    }

    async initialize(params: lsp.InitializeParams): Promise<lsp.InitializeResult> {
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

    async didOpenTextDocument(params: lsp.DidOpenTextDocumentParams) {
        this.parsing = new Promise(async (resolve, reject) => {
            this.parseReject?.();
            this.parseReject = reject;
            resolve(PDFLanguageParser.parse(params.textDocument.text))
        });
    }

    async didChangeTextDocument(params: lsp.DidChangeTextDocumentParams) {
        this.parsing = new Promise(async (resolve, reject) => {
            this.parseReject?.();
            this.parseReject = reject;
            resolve(PDFLanguageParser.parse(params.contentChanges[0]?.text))
        });
    }

    async completion(params: lsp.CompletionParams): Promise<lsp.CompletionItem[]> {
        return await this.parsing?.then((result) => {
            const scopes = result.scopes;
            const inScopes = this.detectScope(scopes, params.position);

            const items = [
                "obj", "endobj", "stream", "endstream", "R",
                "xref", "trailer", "startxref", "%%EOF"
            ].map((label) => ({
                label: label,
                kind: lsp.CompletionItemKind.Keyword,
            } as lsp.CompletionItem));

            if (params.position.line === 0 && params.position.character === 1) {
                items.push(...[{
                    label: "%PDF-1.0",
                    kind: lsp.CompletionItemKind.Keyword,
                }]);
            }

            for (const scope of inScopes) {
                if (scope.kind === "dict-key") {
                    if (scope.dictType === "trailer") {
                        items.push(...[
                            "/Size", "/Prev", "/Root", "/Info",
                        ].map((label) => ({
                            label: label,
                            kind: lsp.CompletionItemKind.Variable,
                        })));
                    } else {
                        items.push(...[{
                            label: "/Type",
                            kind: lsp.CompletionItemKind.Variable,
                        }]);
                    }
                } else if (scope.kind === "dict-value") {
                    if (scope.key === "/Type") {
                        items.push(...["/Catalog", "/Page", "/Pages", "/Font"].map((label) => ({
                            label: label,
                            kind: lsp.CompletionItemKind.Variable,
                        })));
                    }
                }
            }

            return items;
        }) || [];
    }

    detectScope(scopes: Scope[], position: lsp.Position): Scope[] {
        const ret = <Scope[]>[];
        for (const scope of scopes) {
            const shiftedRange: lsp.Range = {
                start: {
                    line: scope.range.start.line,
                    character: scope.range.start.character + 1,
                },
                end: {
                    line: scope.range.end.line,
                    character: scope.range.end.character + 1,
                },
            }
            if (this.isInRange(shiftedRange, position)) {
                ret.push(scope);
            }
        }
        return ret;
    }

    isInRange(range: lsp.Range, position: lsp.Position): boolean {
        if (range.start.line <= position.line && position.line <= range.end.line) {
            if (range.start.line === range.end.line) {
                return range.start.character <= position.character && position.character <= range.end.character
            } else {
                if (range.start.line === position.line) {
                    return range.start.character <= position.character;
                }
                if (position.line === range.end.line) {
                    return position.character <= range.end.character;
                }
                return true;
            }
        } else {
            return false;
        }
    }

}
