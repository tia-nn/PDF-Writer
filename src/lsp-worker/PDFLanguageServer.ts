import { encodeTextString } from "@/tools/encoding";
import { PDFLanguageParser } from "./PDFLanguageParser";
import { ParseResult, RangeIndex, Scope, TokenLocations } from "./types";
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
            uri: "file://main.pdf",
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

    async definition(params: lsp.DefinitionParams): Promise<lsp.Definition | null> {
        return await this.parsing?.then((result) => {
            const reference = this.detectReference(result.references, params.position);
            if (reference) {
                return result.definitions[reference] || null;
            } else {
                return null;
            }
        }) || null;
    }

    async codeLens(params: lsp.CodeLensParams): Promise<lsp.CodeLens[]> {
        return await this.parsing?.then((result) => {
            return result.streams.map((stream) => ({
                range: stream.range,
                command: {
                    title: "Upload File",
                    command: "pdf.uploadFile",
                    arguments: [stream],
                },
            }));
        }) || [];
    }

    async executeCommand(params: lsp.ExecuteCommandParams): Promise<any> {
        if (params.command === "pdf.encodeTextString") {
            return await this.commandEncodeTextString(params.arguments || {});
        } else {
            return null;
        }
    }

    async commandEncodeTextString({ }: {}): Promise<{ buffer: SharedArrayBuffer }> {
        return { buffer: new SharedArrayBuffer(0) };

        // また後で実装する

        return await this.parsing?.then(async (result) => {
            const b: BlobPart[] = []
            let after = "";
            for (const stream of result.streams) {
                const [before, contents, _after] = this.splitContents(result.source, stream.range);
                after = _after;
                const streamContents = contents.slice("stream\n".length, -"\nendstream".length + 1);
                const encoded = encodeTextString(streamContents);
                b.push(before, "stream\n", encoded, "\nendstream");
            }
            b.push(after);
            const blob = new Blob(b, { type: "application/pdf" });
            const buffer = new SharedArrayBuffer(blob.size);
            new Uint8Array(buffer).set(new Uint8Array(await blob.arrayBuffer()));
            return { buffer };
        }) || { buffer: new SharedArrayBuffer(0) };
    }

    private detectScope(scopes: Scope[], position: lsp.Position): Scope[] {
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

    private detectReference(references: TokenLocations, position: lsp.Position): string {
        for (const key in references) {
            if (this.isInRange(references[key].range, position)) {
                return key;
            }
        }
        return "";
    }

    private detectDefinition(definitions: TokenLocations, position: lsp.Position): lsp.Location | null {
        for (const key in definitions) {
            if (this.isInRange(definitions[key].range, position)) {
                return definitions[key];
            }
        }
        return null;
    }

    private isInRange(range: lsp.Range, position: lsp.Position): boolean {
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

    private splitContents(source: string, range: RangeIndex): [string, string, string] {
        return [
            source.slice(0, range.startIndex),
            source.slice(range.startIndex, range.stopIndex),
            source.slice(range.stopIndex),
        ]
    }

    private getContents(source: string, range: lsp.Range): string {
        const lines = source.split("\n");
        if (range.start.line === range.end.line) {
            return lines[range.start.line].slice(range.start.character, range.end.character);
        } else {
            return [
                lines[range.start.line].slice(range.start.character),
                ...lines.slice(range.start.line + 1, range.end.line),
                lines[range.end.line].slice(0, range.end.character),
            ].join("\n");
        }
    }

    private replaceContents(source: string, range: lsp.Range, text: string): string {
        const lines = source.split("\n");
        return [
            ...lines.slice(0, range.start.line),
            lines[range.start.line].slice(0, range.start.character) +
            text +
            lines[range.end.line].slice(range.end.character),
            ...lines.slice(range.end.line + 1),
        ].join("\n");
    }
}
