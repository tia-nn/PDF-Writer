import { ParseResult, Scope, IndirectDefLocations, IndirectRefLocations } from "./types";
import * as lsp from "vscode-languageserver-protocol";
import { BasePDFParserListener } from "./listener/BasePDFParserListener";
import { DiagnosticParser } from "./listener/Diagnostic";
import { StreamParser } from "./listener/Stream";
import { IndirectParser } from "./listener/Indirect";
import { ScopeParser } from "./listener/Scope";


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
        this.parse(params.textDocument.text);
    }

    async didChangeTextDocument(params: lsp.DidChangeTextDocumentParams) {
        this.parse(params.contentChanges[0].text);
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
                const [o, g] = reference;
                return result.definitions[o]?.[g] || [];
            } else {
                return null;
            }
        }) || null;
    }

    async references(params: lsp.ReferenceParams): Promise<lsp.Location[]> {
        return await this.parsing?.then((result) => {
            const definition = this.detectDefinition(result.definitions, params.position);
            if (definition) {
                const [o, g] = definition;
                return result.references[o]?.[g] || [];
            } else {
                console.log("not found");
                return [];
            }
        }) || [];
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

        // return await this.parsing?.then(async (result) => {
        //     const b: BlobPart[] = []
        //     let after = "";
        //     for (const stream of result.streams) {
        //         const [before, contents, _after] = this.splitContents(result.source, stream.range);
        //         after = _after;
        //         const streamContents = contents.slice("stream\n".length, -"\nendstream".length + 1);
        //         const encoded = encodeTextString(streamContents);
        //         b.push(before, "stream\n", encoded, "\nendstream");
        //     }
        //     b.push(after);
        //     const blob = new Blob(b, { type: "application/pdf" });
        //     const buffer = new SharedArrayBuffer(blob.size);
        //     new Uint8Array(buffer).set(new Uint8Array(await blob.arrayBuffer()));
        //     return { buffer };
        // }) || { buffer: new SharedArrayBuffer(0) };
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

    private detectReference(references: IndirectRefLocations, position: lsp.Position): [number, number] | null {
        for (const o in references) {
            for (const g in references[o]) {
                // if (references[o] === undefined || references[o][g] === undefined) continue;
                for (const ref of references[o][g]) {
                    if (this.isInRange(ref.range, position)) {
                        return [parseInt(o), parseInt(g)];
                    }
                }
            }
        }
        return null;
    }

    private detectDefinition(definitions: IndirectDefLocations, position: lsp.Position): [number, number] | null {
        for (const o in definitions) {
            for (const g in definitions[o]) {
                // if (definitions[o] === undefined || definitions[o][g] === undefined) continue;
                if (this.isInRange(definitions[o][g].range, position)) {
                    return [parseInt(o), parseInt(g)];
                }
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

    private parse(s: string) {
        this.parsing = new Promise(async (resolve, reject) => {
            this.parseReject?.();
            this.parseReject = reject;
            const diagnosticParser = new DiagnosticParser();
            const streamParser = new StreamParser();
            const indirectParser = new IndirectParser();
            const scopeParser = new ScopeParser();
            BasePDFParserListener.parse(s, [diagnosticParser, streamParser, indirectParser, scopeParser]);
            const i = indirectParser.result();
            resolve({
                source: s,
                diagnostic: diagnosticParser.result(),
                scopes: scopeParser.result(),
                references: i.reference,
                definitions: i.definition,
                streams: streamParser.result(),
            });
        });
    }
}
