import React, { useCallback, useEffect, useRef, useState } from "react";
import "./Writer.css";
import { Editor } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import * as _monaco from 'monaco-editor/esm/vs/editor/editor.api';

import * as PDFLanguage from './writer/language/PDFLanguage';
import { completeClosingQuote } from "./writer/monaco/CompleteQuote";

function Writer({ value, options, onChange }: { value: string, options: { completeClosingQuote: boolean, }, onChange: (v: string) => void; }) {
    const preventChangeEvent = useRef(false);

    const monacoRef = useRef<typeof _monaco>();
    const editorRef = useRef<editor.IStandaloneCodeEditor>();

    // - - - handler - - -

    const handleEditorMount = useCallback((mountedEditor: editor.IStandaloneCodeEditor, mountedMonaco: typeof _monaco) => {
        PDFLanguage.registerLanguagePDF(mountedMonaco, mountedEditor);
        editorRef.current = mountedEditor;
        monacoRef.current = mountedMonaco;

        PDFLanguage.didOpenTextDocument(value);

        // (, <, [ 入力時に閉じquoteも補完する
        (mountedEditor as any).onDidType((text: string) => {
            if (options.completeClosingQuote) completeClosingQuote(mountedEditor, text);
        });
    }, []);

    const handleChange = useCallback((newValue: string | undefined, ev: editor.IModelContentChangedEvent) => {
        if (preventChangeEvent.current) return;
        if (onChange && newValue != null) onChange(newValue);
        PDFLanguage.didChangeTextDocument(newValue!);
    }, [editorRef.current]);

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

export default Writer;
