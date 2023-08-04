import { ErrorNode, ParserRuleContext, TerminalNode } from "antlr4";
import PDFParserListener from "../antlr/dist/PDFParserListener";
import PDFParser, { StartContext } from "../antlr/dist/PDFParser";
import PDFLexer from "../antlr/dist/PDFLexer";
import { StartNode } from "./ast/start";
import { BaseASTNode, NodeSrc, SrcNode, UnionNode, UnionTerminal } from "./ast/base";

export type DebugListenerNode = {
    kind: "node",
    symbol: string,
    children: (DebugListenerNode | DebugListenerTerminal | DebugListenerErrorTerminal)[],
    ctx: ParserRuleContext,
};

export type DebugListenerTerminal = {
    kind: "terminal",
    symbol: string,
    src: string,
    terminal: TerminalNode,
};

export type DebugListenerErrorTerminal = {
    kind: "terminal-error",
    symbol: string,
    src: string,
    terminal: TerminalNode,
};

interface ParserRuleContextWithRuleIndex extends ParserRuleContext {
    get ruleIndex(): number;
}

export class DebugListener extends PDFParserListener {
    currentNode?: DebugListenerNode;
    lastNodeStack: DebugListenerNode[];

    constructor() {
        super();
        this.lastNodeStack = [];
    }

    enterEveryRule(ctx: ParserRuleContext): void {
        const ruleIndex = (ctx as ParserRuleContextWithRuleIndex).ruleIndex;
        const symbol = PDFParser.ruleNames[ruleIndex];
        if (this.currentNode) this.lastNodeStack.push(this.currentNode);
        this.currentNode = {
            kind: "node",
            symbol: symbol,
            children: [],
            ctx: ctx,
        };
    }

    exitEveryRule(ctx: ParserRuleContext): void {
        const lastNode = this.lastNodeStack.pop();
        if (lastNode && this.currentNode) {
            lastNode.children.push(this.currentNode);
            this.currentNode = lastNode;
        }
    }

    visitErrorNode(node: ErrorNode): void {
        if (this.currentNode) {
            this.currentNode.children.push({
                kind: "terminal-error",
                symbol: (PDFParser.symbolicNames[node.symbol.type] || ''),
                src: node.getText(),
                terminal: node,
            });
        }
    }

    visitTerminal(node: TerminalNode): void {
        if (this.currentNode) {
            this.currentNode.children.push({
                kind: "terminal",
                symbol: PDFParser.symbolicNames[node.symbol.type] || '',
                src: node.getText(),
                terminal: node,
            });
        }
    }
}

export type DebugASTNode = {
    kind: "node",
    key: string,
    children: (DebugASTNode | DebugASTErrorNode | DebugASTTerminal | DebugASTMissingTerminal)[],
    node: BaseASTNode,
};

export type DebugASTErrorNode = {
    kind: "error-node",
    key: string,
    children: (DebugASTNode | DebugASTErrorNode | DebugASTTerminal | DebugASTMissingTerminal)[],
    node: BaseASTNode,
};

export type DebugASTTerminal = {
    kind: "terminal",
    key: string,
    src: string,
    terminal: TerminalNode,
};

export type DebugASTMissingTerminal = {
    kind: "missing-terminal",
    key: string,
};

export class DebugAST {
    visitNode(key: string, node: BaseASTNode): DebugASTNode | DebugASTErrorNode {
        console.log('visitNode start', key, node);
        if (node.src) {
            if (Array.isArray(node.src)) {
                return {
                    kind: "node",
                    key: key,
                    children: node.src.map(s => this.visitSrc(key, s)),
                    node: node,
                };
            } else try {
                return {
                    kind: "node",
                    key: key,
                    children: [this.visitSrc(key, (node.src as SrcNode))],
                    node: node,
                };
            } catch {
                console.log('this is record src', node.src);
                const src = node.src as Record<string, SrcNode | SrcNode[]>;
                const keys = Object.keys(src);
                let children: DebugASTNode[] = [];
                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i];
                    const n = src[key];
                    console.log('record src key', key, n);
                    children.push({
                        kind: "node",
                        key: key,
                        children: Array.isArray(n) ? n.map(nn => this.visitSrc(key, nn)) : [this.visitSrc(key, n)],
                        node: node,
                    });
                }
                return {
                    kind: "node",
                    key: key,
                    children: children,
                    node: node,
                };
            }
        } else {
            return {
                kind: "error-node",
                key: key,
                children: [],
                node: node,
            };
        }
    };

    visitSrc(key: string, src: SrcNode): DebugASTNode | DebugASTErrorNode | DebugASTTerminal | DebugASTMissingTerminal {
        console.log('visitsrc', key, src);
        console.log('src instanceof BaseASTNode', src instanceof BaseASTNode);
        if (src instanceof BaseASTNode) {
            console.log('baseastnode', key, src);
            return this.visitNode(key, src);
        } else if (src instanceof TerminalNode) {
            return {
                kind: "terminal",
                key: key,
                src: src.getText(),
                terminal: src,
            };
        } else if (src instanceof UnionTerminal) {
            return {
                kind: "terminal",
                key: key,
                src: src.node.getText(),
                terminal: src.node,
            };
        } else if (src instanceof UnionNode) {
            return this.visitNode(key, src.node);
        } else {
            console.error(key, src);
            throw new Error(key);
        }
    };

    visitTerminal(key: string, node: TerminalNode | undefined): DebugASTTerminal | DebugASTMissingTerminal {
        if (node) {
            return {
                kind: "terminal",
                key: key,
                src: node.getText(),
                terminal: node,
            };
        } else {
            return {
                kind: "missing-terminal",
                key: key,
            };
        }
    }


}
