import { ParseTreeWalker, TerminalNode } from "antlr4";
import './ParserDebug.css';
import { DebugAST, DebugListener } from "../../../parser/ast/parser-debug-listner";
import * as parser from "../writer/language/Parser";
import React from "react";

/**
 *
 * @param {Object} props
 * @param {string} props.text
 * @returns {React.JSX.Element}
 */
function ParserDebug({ text }) {
    const tree = parser.tree(text);

    const ast = (() => {
        try {
            return parser.parseTree(tree);
        } catch (e) {
            console.error(e);
            return null;
        }
    })();

    const walker = new DebugListener();
    ParseTreeWalker.DEFAULT.walk(walker, parser.tree(text));
    const main = walker.currentNode ? <ul>{buildTree(walker.currentNode)}</ul> : "Error.";

    console.log(ast);

    const a = (() => {
        try {
            return ast ? <ul>{buildAst(new DebugAST().visitNode('start', ast))}</ul> : "Error.";
        } catch (e) {
            console.error(e);
            return null;
        }
    })();

    return (
        <section className="viewer-debug">
            <div className="viewer-debug-inner">
                {main}
                {a}
            </div>
        </section>
    );
}

/**
 * @return {React.JSX.Element}
 */
function buildAst(node) {
    if (node.kind === "node") {
        return (<>
            <li>{node.key}</li>
            <ul>{node.children.map(buildAst)}</ul>
        </>);
    } else if (node.kind === "error-node") {
        return (<>
            <li className="error">{node.key}</li>
            <ul>{node.children.map(buildAst)}</ul>
        </>);
    } else if (node.kind === "terminal") {
        return (<li>{node.key} : <code><pre>{node.src}</pre></code></li>);
    } else if (node.kind === "missing-terminal") {
        return (<li className="error">{node.key} : <code><pre>{node.src}</pre></code></li>);
    } else {
        throw 'in buildAst';
    }
}

/**
 * @param {import("../../../parser/ast/parser-debug-listner").DebugListenerNode | import("../../../parser/ast/parser-debug-listner").DebugListenerTerminal} node
 * @return {React.JSX.Element}
 */
function buildTree(node) {
    if (node.kind === "node") {
        return (<>
            <li className={node.ctx.exception ? "error" : ""}>{node.symbol}</li>
            <ul>{node.children.map(buildTree)}</ul>
        </>);
    } else if (node.kind === "terminal") {
        return (<li>{node.symbol} : <code><pre>{node.src}</pre></code></li>);
    } else if (node.kind === "terminal-error") {
        return (<li className="error">{node.symbol} : <code><pre>{node.src}</pre></code></li>);
    } else {
        throw '';
    }
}

export default ParserDebug;
