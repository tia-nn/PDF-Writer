import { ASTVisitor } from "./ASTVisitor";
import { BodyNode } from "./ast/doby";
import { ObjectNode } from "./ast/object";
import { StartNode } from "./ast/start";
import { StreamNode } from "./ast/stream";

export class StreamDetector extends ASTVisitor<StreamNode[]> {

    detect(node: StartNode) {
        return this.visitStart(node);
    }

    visitStart(node: StartNode): StreamNode[] {
        if (node.v.body) return this.visitBody(node.v.body.src);
        else return [];
    }

    visitBody(node: BodyNode): StreamNode[] {
        return (node.v.src.map(n => n.v.object?.src).filter(n => n) as ObjectNode[]).map(this.visitObject).flat(1);
    }

    visitObject(node: ObjectNode): StreamNode[] {
        if (!node.v) return [];
        else {
            if (node.v.src.kind == "stream") {
                return [node.v.src.node];
            } else if (node.v.src.kind == "dict") {
                return [];
            } else if (node.v.src.kind == "array") {
                return [];
            }
            else return [];
        }
    }
}
