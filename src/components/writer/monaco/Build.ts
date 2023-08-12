import { editor, IRange } from 'monaco-editor';


export function buildEditOperation(model: editor.ITextModel, start: number, end: number, diff: string): editor.IIdentifiedSingleEditOperation {
    const startPos = model.getPositionAt(start);
    const endPos = model.getPositionAt(end);
    const range: IRange = {
        startLineNumber: startPos.lineNumber,
        startColumn: startPos.column,
        endLineNumber: endPos.lineNumber,
        endColumn: endPos.column,
    };

    return {
        range: range,
        text: diff,
    };
}
