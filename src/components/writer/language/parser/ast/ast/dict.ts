import { TerminalNode } from "antlr4";
import { BaseASTNode, UnionTerminal, UnionNode, TermErrorType } from "./base";
import { ArrayContext, DictContext, DictPairContext } from "../../antlr/dist/PDFParser";
import { ObjKindName, ObjKindNumber, ObjKindString, ObjKindNull, ObjectNode, ObjKindArray } from "./object";
import { NameNode } from "./name";

// type ObjectValueWithoutSelf = (ObjKindArray | ObjKindName | ObjKindNumber | ObjKindString | ObjKindNull)['node']['value'];
// interface ObjectRecord extends Record<string, ObjectValueWithoutSelf | ObjectRecord> { }

export interface DictNode extends BaseASTNode {
    ctx: DictContext;
    v: {
        dictOpen: { src: TerminalNode, },
        contents: { src: DictPairNode[], srcObj: Record<string, ObjectNode | undefined>; },
        dictClose?: { src: TerminalNode, value: TermErrorType, },
    };
}

export interface DictPairNode extends BaseASTNode {
    ctx: DictPairContext;
    v: {
        name?: { src: NameNode, value: string, },
        object?: { src: ObjectNode, },
    };
}
