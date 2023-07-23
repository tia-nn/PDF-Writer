import { useCallback, useEffect, useRef, useState } from "react"
import "./Writer.css"
import { Editor } from '@monaco-editor/react'
import MonarchLanguagePDF from "../monaco-pdf/monarch-language-pdf"

import PDFParser from '../../parser/antlr/dist/PDFParser'
import PDFLexer from '../../parser/antlr/dist/PDFLexer'
import PDFLexerPrinter from '../../parser/antlr/PDFLexerPrinter'
import antlr4 from 'antlr4'
import { DetectIndirectDefines } from '../../parser/ast/detect-indirect-define'

/**
 * @typedef {import('antlr4/tree/TerminalNode').default} TerminalNode
 * @typedef {import('antlr4/context/ParserRuleContext').default} ParserRuleContext
 */

/**
 * @typedef {import("@monaco-editor/react").Monaco | null} Monaco
 * @typedef {import("monaco-editor/esm/vs/editor/editor.api").editor.IStandaloneCodeEditor | null} Editor
*/

/**
 *
 * @param {Object} props
 * @param {string} props.value
 * @param {function(string):void} props.onChange
 * @returns {JSX.Element}
 */
function Writer({ value, onChange }) {
    /** @type {Monaco} */
    let monaco;
    /** @type {Editor} */
    let editor;
    const [[_monaco, _editor], setMonacoEditor] = useState([monaco, editor])
    monaco = _monaco;
    editor = _editor


    const handleEditorMount = useCallback((mountedEditor, mountedMonaco) => {
        // editor = mountedEditor;
        // monaco = mountedMonaco;
        mountedMonaco.languages.register({ id: 'pdf' });
        mountedMonaco.languages.setMonarchTokensProvider('pdf', MonarchLanguagePDF);
        setMonacoEditor([mountedMonaco, mountedEditor]);
    }, []);

    const handleChange = useCallback((newValue, ev) => {
        console.log(autoXref(newValue));
        if (onChange) onChange(newValue);
    }, []);


    // const asciiChars = Buffer.from(value, 'ascii');
    // console.log();
    // const encoded = new TextEncoder().encode(value);
    // const inputAscii = new TextDecoder('ascii').decode(encoded);

    // const chars = new antlr4.InputStream(value);
    // const lexer = new PDFLexer(chars);
    // const tokens = new antlr4.CommonTokenStream(lexer);
    // const parser = new PDFParser(tokens);
    // parser.buildParseTrees = true;
    // const tree = parser.start();

    // const listener = new PDFLexerPrinter();
    // antlr4.tree.ParseTreeWalker.DEFAULT.walk(listener, tree);

    // const indirectDefineDetector = new DetectIndirectDefines();
    // antlr4.tree.ParseTreeWalker.DEFAULT.walk(indirectDefineDetector, tree);
    // console.log(indirectDefineDetector.defines);

    // const a = indirectDefineDetector.defines[0];

    // console.log(a.position);
    // if (monaco && editor) {
    //     const model = editor.getModel();
    //     console.log(a.position);
    //     const start = model.getPositionAt(a.position.start);
    //     const stop = model.getPositionAt(a.position.stop);
    //     console.log(start.lineNumber, start.column, stop.column, stop.lineNumber);
    //     monaco.editor.setModelMarkers(editor.getModel(), "test-owner", [
    //         {
    //             startColumn: start.column,
    //             startLineNumber: start.lineNumber,
    //             endColumn: stop.column,
    //             endLineNumber: stop.lineNumber,
    //             message: 'test message',
    //             severity: monaco.MarkerSeverity.Info,
    //         }
    //     ])
    // }


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

function autoXref(value) {
    const chars = new antlr4.InputStream(value);
    const lexer = new PDFLexer(chars);
    const tokens = new antlr4.CommonTokenStream(lexer);
    const parser = new PDFParser(tokens);
    parser.buildParseTrees = true;
    const tree = parser.start();

    const indirectDefineDetector = new DetectIndirectDefines();
    antlr4.tree.ParseTreeWalker.DEFAULT.walk(indirectDefineDetector, tree);
    const defines = indirectDefineDetector.defines;

    // defines.sort((a, b) => a.tokens.objectNumber.value - b.tokens.objectNumber.value)
    // console.log(defines);

    /** @type {Array<{objectNumber: number, generationNumber: number, start: number}>} */
    const defPos = [];
    for (let i = 0; i < defines.length; i++) {
        const d = defines[i];
        defPos[d.tokens.objectNumber.value] = {
            objectNumber: d.tokens.objectNumber.value,
            generationNumber: d.tokens.generationNumber.value,
            start: d.position.start,
        };
    }

    for (let i = 0; i < defPos.length; i++) {
        const d = defPos[i];
        if (d) {
            const entry = ('0000000000' + d.start.toString()).slice(-10)
                + ' ' + ('00000' + d.generationNumber.toString()).slice(-5)
                + ' ' + 'n' + ' \n';
        } else {
            console.log('TODO');
        }
    }


    console.log('done')

}


export default Writer;
