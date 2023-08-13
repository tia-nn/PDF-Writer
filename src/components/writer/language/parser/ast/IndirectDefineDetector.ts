import { ASTVisitor } from "./ASTVisitor";
import { BodyNode } from "./ast/doby";
import { IndirectDefineNode } from "./ast/indirect";
import { StartNode } from "./ast/start";

export class IndirectDefineDetector extends ASTVisitor<IndirectDefineNode[]> {
    detect(node: StartNode) {
        return this.visitStart(node);
    }

    visitStart(node: StartNode, ...args: any[]): IndirectDefineNode[] {
        if (node.v.body) return this.visitBody(node.v.body.src);
        else return [];
    }

    visitBody(node: BodyNode, ...args: any[]): IndirectDefineNode[] {
        return node.v.src.map(this.visitIndirectDefine).flat(1);
    }

    visitIndirectDefine(node: IndirectDefineNode, ...args: any[]): IndirectDefineNode[] {
        if (node.v.kObj && node.v.kEndobj) return [node];
        else return [];
    }
}
