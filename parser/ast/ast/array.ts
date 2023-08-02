import { TerminalNode } from "antlr4";
import { BaseASTNode, UnionTerminal, UnionNode } from "./base";
import { ArrayContext } from "../../antlr/dist/PDFParser";
import { ObjKindName, ObjKindNumber, ObjKindString, ObjKindNull, ObjectNode, ObjKindDict } from "./object";


type ArrayValue = ((ObjKindDict | ObjKindName | ObjKindNumber | ObjKindString | ObjKindNull)['node']['value'] | ArrayValue)[];

export interface ArrayNode extends BaseASTNode {
    ctx: ArrayContext;
    src?: {
        arrayOpen: TerminalNode,
        contents: ObjectNode[],
        arrayClose: TerminalNode,
    },
    value: ArrayValue;
}
