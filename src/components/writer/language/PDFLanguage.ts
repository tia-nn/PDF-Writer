import { Monaco } from "@monaco-editor/react";
import { languages } from "monaco-editor";
import MonarchLanguagePDF from "./monarch-language-pdf";


export function registerLanguagePDF(monaco: Monaco) {
    monaco.languages.register({ id: 'pdf' });
    monaco.languages.setMonarchTokensProvider('pdf', MonarchLanguagePDF);
}
