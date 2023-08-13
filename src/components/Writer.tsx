import React, { useCallback, useEffect, useRef, useState } from "react";
import "./Writer.css";
import { Editor } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import * as _monaco from 'monaco-editor/esm/vs/editor/editor.api';

import * as PDFLanguage from './writer/language/PDFLanguage';
import { createErrorMarker } from "./writer/monaco/Marker";
import { detectErrorStart } from "./writer/language/parser/ast/detect-errors";
import parseWorker from "../worker/parse.worker?worker";
import { parse } from "flatted";
import { StartNode } from "./writer/language/parser/ast/ast/start";
import { completeClosingQuote } from "./writer/monaco/CompleteQuote";
import { ScopeDetector } from "./writer/language/completion/ScopeDetector";

function Writer({ value, options, onChange }: { value: string, options: { completeClosingQuote: boolean, }, onChange: (v: string) => void; }) {
    const preventChangeEvent = useRef(false);

    const monacoRef = useRef(null as typeof _monaco | null);
    const editorRef = useRef(null as editor.IStandaloneCodeEditor | null);

    const lastParsed = useRef({} as { ast?: StartNode, src?: string; });

    const parseWorkerRef = useRef(null as Worker | null);

    // - - - handler - - -

    const handleEditorMount = useCallback((mountedEditor: editor.IStandaloneCodeEditor, mountedMonaco: typeof _monaco) => {
        PDFLanguage.registerLanguagePDF(mountedMonaco);
        editorRef.current = mountedEditor;
        monacoRef.current = mountedMonaco;

        // (, <, [ 入力時に閉じquoteも補完する
        (mountedEditor as any).onDidType((text: string) => {
            if (options.completeClosingQuote) completeClosingQuote(mountedEditor, text);
        });

        mountedEditor.onDidChangeCursorPosition(e => {
            const model = editorRef.current?.getModel();
            if (lastParsed.current.ast && model) {
                new ScopeDetector().detect(lastParsed.current.ast, model.getOffsetAt(e.position));
            }
        });
    }, []);

    const handleChange = useCallback((newValue: string | undefined, ev: editor.IModelContentChangedEvent) => {
        if (preventChangeEvent.current) return;
        if (onChange && newValue != null) onChange(newValue);
    }, [editorRef.current]);

    const setErrorMarker = useCallback((ast) => {
        const model = editorRef.current?.getModel();
        if (model) {
            const errors = detectErrorStart(ast);
            const markers = createErrorMarker(errors, model);
            monacoRef.current?.editor.setModelMarkers(model, 'writer', markers);
        }
    }, []);

    // - - - worker - - -

    useEffect(() => {
        parseWorkerRef.current = new parseWorker();
        parseWorkerRef.current.onmessage = (e) => {
            const [source, astStr] = e.data;
            if (source == undefined) return;
            lastParsed.current = { src: source, ast: parse(astStr) };
            setErrorMarker(lastParsed.current.ast);
        };
        return () => parseWorkerRef.current?.terminate();
    }, []);

    // - - - effect - - -

    useEffect(() => {
        if (parseWorkerRef.current) {
            parseWorkerRef.current.postMessage(value);
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

export default Writer;
