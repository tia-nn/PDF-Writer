import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./Writer.css";
import { Editor } from '@monaco-editor/react';
import MonarchLanguagePDF from "./writer/language/monarch-language-pdf";

import * as autoFill from './writer/language/AutoFill';
import * as parser from './writer/language/Parser';
import * as PDFLanguage from './writer/language/PDFLanguage';

/**
 * @typedef {import('antlr4/tree/TerminalNode').default} TerminalNode
 * @typedef {import('antlr4/context/ParserRuleContext').default} ParserRuleContext
 */
/**
 * @typedef {import("@monaco-editor/react").Monaco} Monaco
 * @typedef {import("monaco-editor/esm/vs/editor/editor.api").editor.IStandaloneCodeEditor} IStandaloneCodeEditor
 * @typedef {import("monaco-editor/esm/vs/editor/editor.api").editor.IMarkerData} IMarkerData
 * @typedef {import("monaco-editor/esm/vs/editor/editor.api").editor.IIdentifiedSingleEditOperation} IIdentifiedSingleEditOperation
 * @typedef {import("monaco-editor/esm/vs/editor/editor.api").editor.IModelContentChange} IModelContentChange
 * @typedef {import("monaco-editor/esm/vs/editor/editor.api").editor.IModelContentChangedEvent} IModelContentChangedEvent
 * @typedef {import("monaco-editor/esm/vs/editor/editor.api").Position} Position
 * @typedef {import("monaco-editor/esm/vs/editor/editor.api").IRange} IRange
 */

/**
 * @param {Object} props
 * @param {string} props.value
 * @param {boolean} props.autoXref
 * @param {function(string):void} props.onChange
 * @returns {JSX.Element}
 */
function Writer({ value, autoXref, onChange }) {
    /** @type {import("react").RefObject<Position|null>} */
    const preventChangeEvent = useRef(false);

    /** @type {Monaco | null} */
    let monaco;
    /** @type {IStandaloneCodeEditor | null} */
    let editor;
    const [[_monaco, _editor], setMonacoEditor] = useState([monaco, editor]);
    monaco = _monaco;
    editor = _editor;

    const handleEditorMount = useCallback((mountedEditor, mountedMonaco) => {
        PDFLanguage.registerLanguagePDF(mountedMonaco);
        setMonacoEditor([mountedMonaco, mountedEditor]);
    }, []);


    /**
     * @callback EditorChangeHandler
     * @param {string} newValue
     * @param {IModelContentChangedEvent} ev
     */
    const handleChange = useCallback(/** @type {EditorChangeHandler} */(newValue, ev) => {
        if (preventChangeEvent.current) return;

        if (autoXref && editor) {

            const model = editor.getModel();
            if (model == null) {
                if (onChange) onChange(newValue);
                return;
            }

            try {
                const [tree, ast] = parser.parse(newValue);
                const xref = autoFill.buildXrefTable(tree, ast);
                const xrefEditOp = buildEditOperation(editor, xref.start, xref.end, xref.text);

                preventChangeEvent.current = true;
                editor.executeEdits(null, [xrefEditOp]);
                preventChangeEvent.current = false;
            } catch {  // PDF的にエラーのときはテキストだけ更新する。
                if (onChange) onChange(newValue);
                return;
            }

            if (onChange) onChange(editor.getValue());
        } else {
            if (onChange) onChange(newValue);
        }

    }, [monaco, editor]);

    // (, <, [ 入力時に閉じquoteも補完する
    useEffect(() => {
        if (editor && false) {
            const model = editor.getModel();
            editor.onDidType(text => {
                function closeQuote(text) {
                    let selection = editor.getSelection();
                    model.pushEditOperations([], [
                        {
                            range: {
                                startLineNumber: selection.startLineNumber,
                                startColumn: selection.startColumn,
                                endLineNumber: selection.startLineNumber,
                                endColumn: selection.startColumn
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
            });
        }
    }, [editor]);

    return (<main className="writer-main">
        <Editor className="writer-editor"
            onMount={handleEditorMount}
            onChange={handleChange}
            value={value}
            language="pdf"
            options={{
                fontFamily: '"Source Code Pro", "Noto Sans JP", "Last Resort"',
                tabSize: 2,
            }}
        ></Editor>
    </main>);
}

/**
 * @param {IStandaloneCodeEditor} editor
 * @returns {IIdentifiedSingleEditOperation}
 */
function buildEditOperation(editor, start, end, diff) {
    const model = editor.getModel();
    if (!model) {
        throw 'model is null.';
    }

    const startPos = model.getPositionAt(start);
    const endPos = model.getPositionAt(end);
    /** @type {IRange} */
    const range = {
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

export default Writer;
