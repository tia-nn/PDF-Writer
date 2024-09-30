import { ParseResult, Scope, IndirectDefLocations, IndirectRefLocations } from "./types";
import * as lsp from "vscode-languageserver-protocol";
import { BasePDFParserListener, N } from "./listener/BasePDFParserListener";
import { DiagnosticParser } from "./listener/Diagnostic";
import { StreamParser } from "./listener/Stream";
import { IndirectParser } from "./listener/Indirect";
import { ScopeDetector } from "./dict/ScopeDetector";
import { DictKeyDetector } from "./dict/DictKeyDetector";
import { DictDefinitions } from "@/tools/dictTyping";
import { XrefContext } from "./antlr/dist/PDFParser";
import { TokenWithEndPos } from "./antlr/lib";
import { DictParser } from "./listener/DictParser";


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

    async hover(params: lsp.HoverParams): Promise<lsp.Hover | null> {
        return await this.parsing?.then((result) => {
            const key = DictKeyDetector.getDictNameElement(result.dictionaries, params.position);
            if (key) {
                if (key.type === "dict-key") {
                    return {
                        contents: {
                            kind: lsp.MarkupKind.Markdown,
                            value: [
                                `\`${key.key}\``,
                                ``,
                                `${DictDefinitions[key.dictType][key.key]?.description || "No description"}`,
                            ].join("\n"),
                        },
                    }
                } else {
                    const desc = DictDefinitions[key.dictType][key.key]?.enum?.[key.valueName];
                    if (desc !== undefined) {
                        return {
                            contents: {
                                kind: lsp.MarkupKind.Markdown,
                                value: [
                                    `\`${key.key}\` - \`${key.valueName}\``,
                                    ``,
                                    `${desc}`,
                                ].join("\n"),
                            },
                        }
                    }
                }
            } else {
                return null;
            }
        }) || null;
    }

    async codeLens(params: lsp.CodeLensParams): Promise<lsp.CodeLens[]> {
        return await this.parsing?.then((result) => {
            const ret = result.streams.map((stream) => ({
                range: stream.range,
                command: {
                    title: "Upload File",
                    command: "pdf.uploadFile",
                    arguments: [stream],
                },
            } as lsp.CodeLens));
            const xref = result.tree.xref();
            if (xref) {
                ret.push({
                    range: {
                        start: {
                            line: xref.start.line - 1,
                            character: xref.start.column,
                        },
                        end: {
                            line: (xref.stop as TokenWithEndPos).endLine - 1,
                            character: (xref.stop as TokenWithEndPos).endColumn,
                        },
                    },
                    command: {
                        title: "Insert XRef Table",
                        command: "pdf.insertXRefTable",
                        arguments: [],
                    },
                });
            }
            return ret;
        }) || [];
    }

    async executeCommand(params: lsp.ExecuteCommandParams): Promise<any> {
        if (params.command === "pdf.encodeTextString") {
            return await this.commandEncodeTextString(params.arguments || {});
        } else if (params.command === "pdf.insertXRefTable") {
            return await this.commandInsertXRefTable(params.arguments || {});
        } else if (params.command === "pdf.getScope") {
            return await this.commandGetScope(...(params.arguments as [lsp.Position]));
        } else {
            return null;
        }
    }

    async commandGetScope(position: lsp.Position): Promise<{ scope: Scope | null }> {
        return await this.parsing?.then((result) => {
            return { scope: ScopeDetector.getScope(result.dictionaries, position) };
        }) || { scope: null };
    }

    async commandInsertXRefTable({ }: {}): Promise<lsp.TextEdit | null> {
        return await this.parsing?.then((result) => {
            const defines = result.definitions;
            const xref = result.tree.xref() as N<XrefContext>;
            if (!xref) {
                return null;
            }

            const entries: (string | null)[] = [null];
            for (let o = 0; o <= Math.max(...Object.keys(defines).map(v => parseInt(v))); o++) {
                for (const g in defines[o]) {
                    const def = defines[o][g];
                    const offset = ('0000000000' + def.range.start.index).slice(-10)
                    const generation = ('00000' + g).slice(-5)
                    entries.push(`${offset} ${generation} n \n`);
                }
            }

            let i = 0;
            while (true) {
                if (entries[i] == null) {
                    const _next = entries.slice(i + 1).findIndex(el => el == null);
                    const next = _next != -1 ? _next + i + 1 : -1;
                    const g = i == 0 ? "65535" : "00000";
                    if (next != -1) {
                        entries[i] = `${("0000000000" + next.toString()).slice(-10)} ${g} f \n`;
                        i = next;
                        continue;
                    } else {
                        entries[i] = `0000000000 ${g} f \n`;
                        break;
                    }
                }
                i++;
            }

            const section = `xref\n0 ${entries.length}\n` + entries.join('');

            return {
                range: {
                    start: {
                        line: xref.start.line - 1,
                        character: xref.start.column,
                    },
                    end: {
                        line: (xref.stop as TokenWithEndPos).endLine - 1,
                        character: (xref.stop as TokenWithEndPos).endColumn,
                    },
                },
                newText: section,
            } as lsp.TextEdit;
        }) || null;
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
            const dictParser = new DictParser();
            const start = BasePDFParserListener.parse(s, [diagnosticParser, streamParser, indirectParser, dictParser]);
            const i = indirectParser.result();
            resolve({
                source: s,
                tree: start,
                diagnostic: diagnosticParser.result(),
                references: i.reference,
                definitions: i.definition,
                streams: streamParser.result(),
                dictionaries: dictParser.result(),
            });
        });
    }
}
