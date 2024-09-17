import { editor, MarkerSeverity } from 'monaco-editor/esm/vs/editor/editor.api';
import { ErrorReport } from "../language/parser/ast/ast/base";
import { Diagnostic } from 'vscode-languageserver';
import { toMarkerSeverity, toPosition, toRange } from 'monaco-languageserver-types';

export function createErrorMarker(errors: ErrorReport[], model: editor.ITextModel) {
    const markers: editor.IMarkerData[] = [];
    for (let i = 0; i < errors.length; i++) {
        const err = errors[i];
        const start = model.getPositionAt(err.position.start);
        const end = model.getPositionAt(err.position.stop);
        markers.push({
            severity: MarkerSeverity.Error,
            message: err.message,
            startLineNumber: start.lineNumber,
            startColumn: start.column,
            endLineNumber: end.lineNumber,
            endColumn: end.column,
        });
    }
    return markers;
}

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
