import './DebugViewer.css';
import antlr4, { ParserRuleContext } from 'antlr4';
import React, { useMemo } from "react";
import PDFParser from '@/lsp-worker/antlr/dist/PDFParser';
import PDFLexer from '@/lsp-worker/antlr/dist/PDFLexer';
import { RuleIndex } from '@/lsp-worker/types';

const DebugViewer: React.FC<{ value: string }> = ({ value }) => {
    const tree = useMemo(() => {
        const chars = antlr4.CharStreams.fromString(value);
        const lexer = new PDFLexer(chars);
        const tokens = new antlr4.CommonTokenStream(lexer);
        const parser = new PDFParser(tokens);
        const start = parser.start();
        return buildTree(start);
    }, [value]);

    return (<div className="viewer-debug">
        {treeToElement(tree)}
    </div>);
}

type Tree = {
    type: string;
    children: Tree[];
} | {
    type: null;
    children: string;
}

const treeToElement = (tree: Tree): JSX.Element => {
    if (tree.type === null) {
        return <li className="terminal"><code><pre>{tree.children}</pre></code></li>;
    } else {
        return (
            <>
                <span>{tree.type}</span>
                <ul>
                    {tree.children.map((child, idx) => <li key={idx}>{treeToElement(child)}</li>)}
                </ul>
            </>
        )
    }
}

const buildTree: ((ctx: ParserRuleContext) => Tree) = (ctx) => {
    const children = (ctx.children || []) as ParserRuleContext[];
    const type = PDFParser.ruleNames[(ctx as RuleIndex).ruleIndex];
    return {
        type: type,
        children: children.map((child) => {
            if (child instanceof antlr4.ParserRuleContext) {
                return buildTree(child);
            } else {
                const terminal = child as antlr4.TerminalNode;
                return {
                    type: PDFLexer.symbolicNames[terminal.symbol.type],
                    children: [{
                        type: null,
                        children: terminal.getText(),
                    }],
                } as Tree;
            }
        }),
    }
};


export default DebugViewer;
