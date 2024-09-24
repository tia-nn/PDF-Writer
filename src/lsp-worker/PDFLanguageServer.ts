import { ParseResult, Scope, IndirectDefLocations, IndirectRefLocations } from "./types";
import * as lsp from "vscode-languageserver-protocol";
import { BasePDFParserListener } from "./listener/BasePDFParserListener";
import { DiagnosticParser } from "./listener/Diagnostic";
import { StreamParser } from "./listener/Stream";
import { IndirectParser } from "./listener/Indirect";
import { ParseTreeWalker } from "antlr4";
import { ScopeVisitor } from "./listener/ScopeVisitor";


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
        } else if (params.command === "pdf.getScope") {
            return await this.commandGetScope(...(params.arguments as [lsp.Position]));
        } else {
            return null;
        }
    }

    async commandGetScope(position: lsp.Position): Promise<{ scope: Scope | null }> {
        console.log("getScope");
        return await this.parsing?.then((result) => {
            const s = new ScopeVisitor(position);
            ParseTreeWalker.DEFAULT.walk(s, result.tree);
            return { scope: s.result() };
        }) || { scope: null };
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
            const start = BasePDFParserListener.parse(s, [diagnosticParser, streamParser, indirectParser]);
            const i = indirectParser.result();
            resolve({
                source: s,
                tree: start,
                diagnostic: diagnosticParser.result(),
                references: i.reference,
                definitions: i.definition,
                streams: streamParser.result(),
            });
        });
    }
}
