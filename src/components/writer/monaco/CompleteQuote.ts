import { editor, Selection } from "monaco-editor";

export function completeClosingQuote(editor: editor.IStandaloneCodeEditor, text: string) {
    function closeQuote(text) {
        let selection = editor.getSelection() as Selection;
        const model = editor.getModel() as editor.ITextModel;
        model.pushEditOperations([], [
            {
                range: {
                    startLineNumber: selection!.startLineNumber,
                    startColumn: selection!.startColumn,
                    endLineNumber: selection!.startLineNumber,
                    endColumn: selection!.startColumn
                },
                text: text,
            }
        ], (op) => {
            // 返り値が無視されるバグがあるので手動で editor.setSelection する
            // https://github.com/microsoft/monaco-editor/issues/3893
            editor.setSelection(selection);
            return [selection];
        });
    }

    if (text === "(") {
        closeQuote(")");
    } else if (text === "<") {
        closeQuote(">");
    } else if (text === "[") {
        closeQuote("]");
    }
}
