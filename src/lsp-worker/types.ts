import { ParserRuleContext, TerminalNode } from 'antlr4';
import * as lsp from 'vscode-languageserver-protocol';
import { NameContext, ObjectContext } from './antlr/dist/PDFParser';

export interface RuleIndex extends ParserRuleContext {
    get ruleIndex(): number;
}

export type ScopeKind = 'header' | 'body_root' | 'object' | 'dict-key' | 'dict-value' | 'xref' | 'trailer';
export type DictType = 'unknown' | 'trailer';

export type Scope = {
    range: lsp.Range;
    kind: Exclude<ScopeKind, 'dict-key' | 'dict-value'>;
} | {
    range: lsp.Range;
    kind: 'dict-key';
    dictType: DictType;
} | {
    range: lsp.Range;
    kind: 'dict-value';
    key: string;
    dictType: DictType;
}

export type DictNode = {
    entries: DictEntry[];
    open: TerminalNode;
    close?: TerminalNode;
    range: lsp.Range;
}

export type DictEntry = {
    name?: NameContext;
    value?: ObjectContext;
}

export type TokenLocations = { [key: string]: lsp.Location };

export interface RangeIndex extends lsp.Range {
    startIndex: number;
    stopIndex: number;
}

export interface LocIndex extends lsp.Location {
    range: RangeIndex;
}

export type ParseResult = {
    source: string;
    diagnostic: lsp.Diagnostic[];
    scopes: Scope[];
    references: TokenLocations;
    definitions: TokenLocations;
    streams: LocIndex[];
}
