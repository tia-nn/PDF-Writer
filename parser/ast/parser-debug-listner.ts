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
    children: (DebugASTNode | DebugASTTerminal | DebugASTMissing)[],
    node: BaseASTNode,
};

export type DebugASTTerminal = {
    kind: "terminal",
    key: string,
    src: string,
    terminal: TerminalNode,
};

export type DebugASTMissing = {
    kind: "missing",
    key: string,
};

export class DebugAST {
    visitNode(key: string, node: BaseASTNode): DebugASTNode | DebugASTTerminal | DebugASTMissing {
        const v = node.v; // { src: NodeSrc, value?: any, } | Record<string, { src: NodeSrc, value?: any, } | undefined> | undefined

        if (v) {
            if ('src' in v) {  // { src: NodeSrc, value?: any, }
                const vSrc = v.src as NodeSrc;
                return {
                    kind: "node",
                    key: this.getName(node.ctx),
                    children: this.visitNodeSrc(this.getName(node.ctx), vSrc),
                    node: node,
                };
            } else { // Record<string, SrcValue | undefined>
                const src = node.v as Record<string, { src: NodeSrc, value?: any, } | undefined>;
                const keys = Object.keys(src);
                let children: (DebugASTNode | DebugASTTerminal | DebugASTMissing)[] = [];
                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i];
                    const n = src[key]?.src;
                    if (n) {
                        children.push(...this.visitNodeSrc(key, n));
                    } else {
                        children.push({
                            kind: "missing",
                            key: key,
                        });
                    }
                }
                return {
                    kind: "node",
                    key: this.getName(node.ctx),
                    children: children,
                    node: node,
                };
            }
        } else {
            return {
                kind: "missing",
                key: this.getName(node.ctx),
            };
        }
    };

    visitNodeSrc(key: string, src: NodeSrc): (DebugASTNode | DebugASTTerminal | DebugASTMissing)[] {
        // TerminalNode | BaseASTNode | UnionNode | UnionTerminal | (...)[] | Record<string, (...)>
        if (Array.isArray(src)) {  // (...)[]
            return src.map((s) => this.visitNodeSrc(key, s)).flat(1);
        } else if (src instanceof TerminalNode) {
            return [{
                kind: "terminal",
                key: key,
                src: src.getText(),
                terminal: src,
            }];
        } else if (src._kind === "unionterminal") {
            return [{
                kind: "terminal",
                key: key,
                src: src.node.getText(),
                terminal: src.node,
            }];
        } else if (src._kind === "baseastnode") {
            return [this.visitNode(key, src)];
        } else if (src._kind === "unionnode") {
            return [this.visitNode(key, src.node)];
        } else {
            const keys = Object.keys(src);
            let children: (DebugASTNode | DebugASTTerminal | DebugASTMissing)[] = [];
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                const n = src[key];
                if (n) {
                    children.push(...this.visitNodeSrc(key, n));
                } else {
                    children.push({
                        kind: "missing",
                        key: key,
                    });
                }
            }
            return children;
        }
    };

    // visitSrc(key: string, src: SrcNode): DebugASTNode | DebugASTTerminal | DebugASTMissing {
    //     if (!src) {
    //         return {
    //             kind: "missing-terminal",
    //             key: key,
    //         };
    //     } else if (src instanceof TerminalNode) {
    //         return {
    //             kind: "terminal",
    //             key: key,
    //             src: src.getText(),
    //             terminal: src,
    //         };
    //     } else if (src._kind === "baseastnode") {
    //         return this.visitNode(key, src);
    //     } else if (src._kind === "unionterminal") {
    //         return {
    //             kind: "terminal",
    //             key: key,
    //             src: src.node.getText(),
    //             terminal: src.node,
    //         };
    //     } else if (src._kind === "unionnode") {
    //         return this.visitNode(key, src.node);
    //     } else {
    //         console.log(src);
    //         throw new Error(key);
    //     }
    // };

    // visitTerminal(key: string, node: TerminalNode | undefined): DebugASTTerminal | DebugASTMissing {
    //     if (node) {
    //         return {
    //             kind: "terminal",
    //             key: key,
    //             src: node.getText(),
    //             terminal: node,
    //         };
    //     } else {
    //         return {
    //             kind: "missing-terminal",
    //             key: key,
    //         };
    //     }
    // }

    getName(ctx: ParserRuleContext) {
        if (!ctx) return '';
        const ruleIndex = (ctx as ParserRuleContextWithRuleIndex).ruleIndex;
        const symbol = PDFParser.ruleNames[ruleIndex];
        return symbol;
    }
}
