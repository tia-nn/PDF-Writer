import { useCallback, useEffect, useRef, useState } from "react";
import "./Writer.css";
import { Editor } from '@monaco-editor/react';

import * as autoFill from './writer/language/AutoFill';
import * as parser from './writer/language/Parser';
import * as PDFLanguage from './writer/language/PDFLanguage';
import { createErrorMarker } from "./writer/monaco/Marker";
import { detectErrorStart } from "../../parser/ast/detect-errors";

/**
 * @typedef {import('antlr4/tree/TerminalNode').default} TerminalNode
 * @typedef {import('antlr4/context/ParserRuleContext').default} ParserRuleContext
 * @typedef {import('../../parser/antlr/dist/PDFParser').StartContext} StartContext
 * @typedef {import('../../parser/ast/ast/start').StartNode} StartNode
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
 * @param {function(string):void} props.onChange
 * @param {{completeClosingQuote: boolean, autofillXrefTable: boolean}} props.options
 * @returns {JSX.Element}
 */
function Writer({ value, options, onChange }) {
    /** @type {import("react").RefObject<Position|null>} */
    const preventChangeEvent = useRef(false);

    /** @type {Monaco | null} */
    let monaco;
    /** @type {IStandaloneCodeEditor | null} */
    let editor;
    const [[_monaco, _editor], setMonacoEditor] = useState([monaco, editor]);
    monaco = _monaco;
    editor = _editor;
    const model = editor?.getModel();

    /** @type {import("react").MutableRefObject<{tree?: StartContext, ast?: StartNode, src?: string, errors?: import("../../parser/ast/ast/base").ErrorReport[]}>} */
    const lastParsed = useRef({});


    // - - - handler - - -

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

        if (options.autofillXrefTable && editor) {

            const model = editor.getModel();
            if (model == null) {
                if (onChange) onChange(newValue);
                return;
            }

            // TODO: 非同期でやる (parse() が重いので)
            // try {
            //     const [tree, ast, errs] = parser.parse(newValue);
            //     lastParsed.current = { tree, ast, src: newValue, errors: errs };  // parse() をキャッシュ

            //     const xref = autoFill.buildXrefTable(tree, ast);
            //     const xrefEditOp = buildEditOperation(editor, xref.start, xref.end, xref.text);

            //     preventChangeEvent.current = true;
            //     editor.executeEdits(null, [xrefEditOp]);
            //     preventChangeEvent.current = false;
            // } catch {  // PDF的にエラーのときはテキストだけ更新する。
            if (onChange) onChange(newValue);
            return;
            // }

            if (onChange) onChange(editor.getValue());
        } else {
            if (onChange) onChange(newValue);
        }

    }, [monaco, editor]);


    // - - - error detect - - -

    const detectErrorCallback = useCallback((ast) => {
        if (monaco && model) {
            const errors = detectErrorStart(ast);
            const markers = createErrorMarker(errors, model);
            console.log(errors);
            // const markers = createErrorMarker(lastParsed.current.errors || [], model);
            monaco.editor.setModelMarkers(model, 'writer', markers);
        }
    }, [monaco, model]);

    // - - - effect - - -

    // parse() のキャッシュがヒットしなかったら parse() する
    useEffect(() => {
        // TODO: throttle
        if (value != lastParsed.current.src) {
            parser.parsePromise(value).then(([tree, ast, errs]) => {
                lastParsed.current = { tree, ast, src: value, errors: errs };
                detectErrorCallback(ast);
            }).catch(e => {
                // console.error(e);
            });
        }
    }, [value]);

    // (, <, [ 入力時に閉じquoteも補完する
    useEffect(() => {
        if (editor && options.completeClosingQuote) {
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
    }, [editor, options.completeClosingQuote]);



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
