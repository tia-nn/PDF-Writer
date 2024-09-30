import * as lsp from 'vscode-languageserver-protocol';

export function isInRange(range: lsp.Range, position: lsp.Position): boolean {
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
