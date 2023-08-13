import './ParserDebug.css';
import React, { useEffect, useRef, useState } from "react";
import buildNodeWorker from "./ParserDebug.worker?worker";
import { parse } from "flatted";

/**
 * @param {Object} props
 * @param {string} props.text
 * @returns {React.JSX.Element}
 */
function ParserDebug({ text }) {
    /** @type {import("react").MutableRefObject<Worker | null>} */
    const workerRef = useRef(null);
    const [[contextTreeEl, astTreeEl], setTreeEl] = useState([<></>, <></>]);

    useEffect(() => {
        workerRef.current = new buildNodeWorker();
        workerRef.current.onmessage = e => {
            const [contextDebugNodeStr, astDebugNodeStr] = e.data;
            setTreeEl([contextDebugNodeStr ? <ul>{buildTree(parse(contextDebugNodeStr))}</ul> : <>Error</>, astDebugNodeStr ? <ul>{buildAst(parse(astDebugNodeStr))}</ul> : <>Error</>]);
        };
        return () => workerRef.current.terminate();
    }, []);

    useEffect(() => {
        if (workerRef.current) {
            workerRef.current.postMessage(text);
        }
    }, [text]);

    return (
        <section className="viewer-debug">
            <div className="viewer-debug-inner">
                {astTreeEl}
                <hr></hr>
                {contextTreeEl}
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
    } else if (node.kind === "terminal") {
        return (<li>{node.key} : <code><pre>{node.src}</pre></code></li>);
    } else if (node.kind === "missing") {
        return (<li className="error">{node.key} : <code><pre>{node.src}</pre></code></li>);
    } else {
        throw 'in buildAst';
    }
}

/**
 * @param {import("../../../parser/ast/DebugNodeBuilder").DebugListenerNode | import("../../../parser/ast/DebugNodeBuilder").DebugListenerTerminal} node
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
