import { useCallback, useEffect, useRef, useState } from "react"
import "./Writer.css"
import { Editor } from '@monaco-editor/react'
import MonarchLanguagePDF from "../monaco-pdf/monarch-language-pdf"

/**
 *
 * @param {Object} props
 * @param {string} props.value
 * @param {function(string):void} props.onChange
 * @returns {JSX.Element}
 */
function Writer({ value, onChange }) {

    /** @type {import("monaco-editor/esm/vs/editor/editor.api").editor.IStandaloneCodeEditor | null} */
    let editor;
    /** @type {import("@monaco-editor/react").Monaco | null} */
    let monaco;

    const handleEditorMount = useCallback((mountedEditor, mountedMonaco) => {
        editor = mountedEditor;
        monaco = mountedMonaco;

        monaco.languages.register({ id: 'pdf' });
        monaco.languages.setMonarchTokensProvider('pdf', MonarchLanguagePDF);
    }, []);

    const handleChange = useCallback((newValue, ev) => {
        if (onChange) onChange(newValue);
    }, []);

    return (<main className="writer-main">
        <Editor className="writer-editor"
            onMount={handleEditorMount}
            onChange={handleChange}
            value={value}
            language="pdf"
            options={{
                fontFamily: '"Source Code Pro", "Noto Sans JP", "Last Resort"',
                tabSize: 2
            }}
        ></Editor>
    </main>);
}


export default Writer;
