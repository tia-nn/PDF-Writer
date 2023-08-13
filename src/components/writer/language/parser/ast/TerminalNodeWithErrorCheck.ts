import { TerminalNode } from "antlr4";

export interface TerminalNodeWithErrorCheck extends TerminalNode {
    isErrorNode?(): boolean;
}

export function isErrorNode(t: TerminalNode) {
    const tt = t as TerminalNodeWithErrorCheck;
    return tt.isErrorNode && tt.isErrorNode();
}

export function isMissingNode(t: TerminalNode) {
    const tt = t as TerminalNodeWithErrorCheck;
    return tt.isErrorNode && tt.isErrorNode() && t.getText().match(/<missing .*>/g);
}
