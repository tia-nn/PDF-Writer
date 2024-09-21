import { editor } from 'monaco-editor/esm/vs/editor/editor.api';
import { Diagnostic } from 'vscode-languageserver-protocol';
import { toMarkerSeverity, toRange } from 'monaco-languageserver-types';

export function createMarkers(diagnostics: Diagnostic[]) {
    const markers: editor.IMarkerData[] = [];
    for (let i = 0; i < diagnostics.length; i++) {
        const diag = diagnostics[i];
        const pos = toRange(diag.range);
        markers.push({
            severity: toMarkerSeverity(diag.severity || 1),
            message: diag.message,
            startLineNumber: pos.startLineNumber,
            startColumn: pos.startColumn,
            endLineNumber: pos.endLineNumber,
            endColumn: pos.endColumn,
        });
    }
    return markers;
}
