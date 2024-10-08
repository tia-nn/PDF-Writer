import { ParserRuleContext, TerminalNode } from 'antlr4';
import * as lsp from 'vscode-languageserver-protocol';
import { NameContext, ObjectContext, StartContext } from './antlr/dist/PDFParser';
import { DictType } from '@/tools/dictTyping';

export interface RuleIndex extends ParserRuleContext {
    get ruleIndex(): number;
}

// export type ScopeKind = 'header' | 'body_root' | 'object' | 'dict-key' | 'dict-value' | 'xref' | 'trailer';
export type ScopeKind = 'header' | 'body_root' | 'object' | 'dict-key' | 'dict-value' | 'xref' | 'trailer';

export type Scope =
    // {
    //     range: lsp.Range;
    //     kind: Exclude<ScopeKind, 'dict-key' | 'dict-value'>;
    // } |
    {
        // range: lsp.Range;
        kind: 'dict-key';
        dictType: DictType;
        have: string[];
    } | {
        // range: lsp.Range;
        kind: 'dict-value';
        key: string;
        dictType: DictType;
    }

export type DictTokenType = {
    type: 'dict-key';
    dictType: DictType;
    key: string;
} | {
    type: 'dict-value';
    dictType: DictType;
    key: string;
    valueName: string;
}

export type DictNode = {
    entries: DictEntryNode[];
    open: TerminalNode;
    close?: TerminalNode;
    range: lsp.Range;
    type: DictType;
}

export type DictEntryNode = {
    name?: NameContext;
    value?: ObjectContext;
}

export type IndirectDefLocations = { [key: number]: { [key: number]: LocIndex } };
export type IndirectRefLocations = { [key: number]: { [key: number]: LocIndex[] } };

export interface PosIndex extends lsp.Position {
    index: number;
}

export interface RangeIndex extends lsp.Range {
    start: PosIndex;
    end: PosIndex;
}

export interface LocIndex extends lsp.Location {
    range: RangeIndex;
}

export type ParseResult = {
    source: string;
    tree: StartContext;
    diagnostic: lsp.Diagnostic[];
    references: IndirectRefLocations;
    definitions: IndirectDefLocations;
    streams: LocIndex[];
    dictionaries: DictNode[];
}
