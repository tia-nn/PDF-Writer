import React, { useCallback, useEffect, useRef } from "react";
import "./Writer.css";
import { Editor } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import * as PDFLanguage from './writer/language/PDFLanguage';
import { useThrottleFn } from "ahooks";

function Writer({ value, onChange }: { value: string, onChange: (v: string) => void; }) {
    const preventChangeEvent = useRef(false);

    const monacoRef = useRef<typeof monaco>();
    const editorRef = useRef<editor.IStandaloneCodeEditor>();

    // - - - handler - - -

    const handleEditorMount = useCallback((mountedEditor: editor.IStandaloneCodeEditor, mountedMonaco: typeof monaco) => {
        PDFLanguage.registerLanguagePDF(mountedMonaco, mountedEditor);
        editorRef.current = mountedEditor;
        monacoRef.current = mountedMonaco;

        const model = mountedEditor.getModel();
        model?.setEOL(editor.EndOfLineSequence.LF);

        PDFLanguage.didOpenTextDocument(value);
    }, []);

    const { run: didChangeTextDocumentThrottled } = useThrottleFn((value: string) => {
        PDFLanguage.didChangeTextDocument(value);
    }, { wait: 100, leading: false });

    useEffect(() => {
        didChangeTextDocumentThrottled(value);
    }, [value]);

    const handleChange = useCallback((newValue: string | undefined, ev: editor.IModelContentChangedEvent) => {
        if (preventChangeEvent.current) return;
        if (onChange && newValue != null) onChange(newValue);
    }, [editorRef.current]);

    return (<main className="writer-main">
        <Editor className="writer-editor"
            onMount={handleEditorMount}
            onChange={handleChange}
            value={value}
            language="pdf"
            path="file://main.pdf"
            options={{
                fontFamily: '"Source Code Pro", "Noto Sans JP", "Last Resort"',
                tabSize: 2,
                autoIndent: 'full',
                stablePeek: true,
            }}
        ></Editor>
    </main>);
}

export default Writer;
