import { editor, MarkerSeverity } from 'monaco-editor/esm/vs/editor/editor.api';
import { ErrorReport } from "../language/parser/ast/ast/base";

function createMarkers() {

}

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
