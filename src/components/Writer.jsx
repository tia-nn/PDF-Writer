import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./Writer.css";
import { Editor } from '@monaco-editor/react';
import MonarchLanguagePDF from "../monaco-pdf/monarch-language-pdf";

import PDFParser from '../../parser/antlr/dist/PDFParser';
import PDFLexer from '../../parser/antlr/dist/PDFLexer';
import antlr4 from 'antlr4';
import { DetectIndirectDefines } from '../../parser/ast/detect-indirect-define';
import { ASTVisitor } from "../../parser/ast/ast-visitor";

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
 */


/** @type {Position} */
let lastPosition;


/**
 * @param {Object} props
 * @param {string} props.value
 * @param {function(string):void} props.onChange
 * @returns {JSX.Element}
 */
function Writer({ value, onChange }) {
    /** @type {Monaco | null} */
    let monaco;
    /** @type {IStandaloneCodeEditor | null} */
    let editor;
    const [[_monaco, _editor], setMonacoEditor] = useState([monaco, editor]);
    monaco = _monaco;
    editor = _editor;

    const handleEditorMount = useCallback((mountedEditor, mountedMonaco) => {
        mountedMonaco.languages.register({ id: 'pdf' });
        mountedMonaco.languages.setMonarchTokensProvider('pdf', MonarchLanguagePDF);
        setMonacoEditor([mountedMonaco, mountedEditor]);
    }, []);


    /**
     * @callback EditorChangeHandler
     * @param {string} newValue
     * @param {IModelContentChangedEvent} ev
     */
    const handleChange = useCallback(/** @type {EditorChangeHandler} */(newValue, ev) => {

        if (editor) {

            const model = editor.getModel();
            if (model == null) {
                if (onChange) onChange(newValue);
                return;
            }

            const chars = new antlr4.InputStream(newValue);
            const lexer = new PDFLexer(chars);
            const tokens = new antlr4.CommonTokenStream(lexer);
            const parser = new PDFParser(tokens);
            parser.buildParseTrees = true;
            const tree = parser.start();

            /** @type {import("../../parser/ast/ast/start").StartNode} */
            const ast = new ASTVisitor().visit(tree);

            lastPosition = editor.getPosition();
            console.log('getposition', lastPosition);

            const xrefStart = ast.src.xref.position.start;
            const trailerStart = ast.src.trailer.src.k_trailer.symbol.start;
            const xref = buildXrefTable(tree);

            console.log(`"${newValue.slice(xrefStart, trailerStart)}"`);

            newValue = newValue.slice(0, xrefStart) + xref + newValue.slice(trailerStart);

            if (onChange) onChange(newValue);
        } else {
            if (onChange) onChange(newValue);
        }

    }, [monaco, editor]);

    console.log(editor, lastPosition);
    useEffect(() => {
        if (editor && lastPosition) {
            console.log('setPosition', lastPosition);
            editor.setPosition(lastPosition);
        }
    }, [value]);

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

function buildXrefTable(tree) {
    const defines = new DetectIndirectDefines().visit(tree);

    /** @type {Array<{objectNumber: number, generationNumber: number, start: number}>} */
    const defPos = [];
    for (let i = 0; i < defines.length; i++) {
        const d = defines[i];
        defPos[d.value.objNum] = {
            objectNumber: d.value.objNum,
            generationNumber: d.value.genNum,
            start: d.position.start,
        };
    }

    const entries = [null];
    for (let i = 1; i < defPos.length; i++) {
        const d = defPos[i];
        if (d) {
            const entry = ('0000000000' + d.start.toString()).slice(-10)
                + ' ' + ('00000' + d.generationNumber.toString()).slice(-5)
                + ' ' + 'n' + ' \n';
            entries.push(entry);
        } else {
            entries.push(null);
        }
    }
    let i = 0;
    while (true) {
        if (entries[i] == null) {
            const _next = entries.slice(i + 1).findIndex(el => el == null);
            const next = _next != -1 ? _next + i + 1 : -1;
            const g = i == 0 ? "65535" : "00000";
            if (next != -1) {
                entries[i] = `${("0000000000" + next.toString()).slice(-10)} ${g} f \n`;
                i = next;
                continue;
            } else {
                entries[i] = `0000000000 ${g} f \n`;
                break;
            }
        }
        i++;
    }

    const section = `xref\n0 ${entries.length}\n` + entries.join('');

    return section;
}

export default Writer;
