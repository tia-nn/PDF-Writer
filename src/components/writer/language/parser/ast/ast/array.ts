import { TerminalNode } from "antlr4";
import { BaseASTNode, UnionTerminal, UnionNode, TermErrorType } from "./base";
import { ArrayContext } from "../../antlr/dist/PDFParser";
import { ObjKindName, ObjKindNumber, ObjKindString, ObjKindNull, ObjectNode, ObjKindDict } from "./object";


// type ArrayValue = ((ObjKindDict | ObjKindName | ObjKindNumber | ObjKindString | ObjKindNull)['node']['value'] | ArrayValue)[];

export interface ArrayNode extends BaseASTNode {
    ctx: ArrayContext;
    v: {
        arrayOpen: { src: TerminalNode, },
        contents: { src: ObjectNode[], },
        arrayClose?: { src: TerminalNode, value: TermErrorType, },
    };
}
