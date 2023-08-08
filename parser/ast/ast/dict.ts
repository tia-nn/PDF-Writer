import { TerminalNode } from "antlr4";
import { BaseASTNode, UnionTerminal, UnionNode } from "./base";
import { ArrayContext, DictContext, Dict_pairContext } from "../../antlr/dist/PDFParser";
import { ObjKindName, ObjKindNumber, ObjKindString, ObjKindNull, ObjectNode, ObjKindArray } from "./object";
import { NameNode } from "./name";

type ObjectValueWithoutSelf = (ObjKindArray | ObjKindName | ObjKindNumber | ObjKindString | ObjKindNull)['node']['value'];
interface ObjectRecord extends Record<string, ObjectValueWithoutSelf | ObjectRecord> { }

export interface DictNode extends BaseASTNode {
    ctx: DictContext;
    src: {
        dictOpen?: TerminalNode,
        contents: DictPairNode[],
        dictClose?: TerminalNode,
    };
    value: ObjectRecord;
}

export interface DictPairNode extends BaseASTNode {
    ctx: Dict_pairContext;
    src: {
        name?: NameNode,
        object?: ObjectNode,
    };
    value: {
        name?: string,
        object?: ObjectRecord['T'];
    };
}
