import { TerminalNode } from "antlr4";
import { BaseASTNode, UnionTerminal, UnionNode } from "./base";
import { ObjectContext } from "../../antlr/dist/PDFParser";
import { ArrayNode } from "./array";
import { NameNode } from "./name";
import { NumberNode } from "./number";
import { StringNode } from "./string";
import { NullObjectNode } from "./null";
import { DictNode } from "./dict";
import { IndirectReferenceNode } from "./indirect";
import { StreamNode } from "./stream";

export type ObjectKind = ObjKindIndirectReference | ObjKindStream | ObjKindDict | ObjKindArray | ObjKindName | ObjKindNumber | ObjKindString | ObjKindNull;

export interface ObjectNode extends BaseASTNode {
    ctx: ObjectContext;
    v?: { src: ObjectKind, };
}

export interface ObjKindIndirectReference extends UnionNode {
    kind: "reference";
    node: IndirectReferenceNode;
}

export interface ObjKindStream extends UnionNode {
    kind: "stream";
    node: StreamNode;
}

export interface ObjKindDict extends UnionNode {
    kind: "dict";
    node: DictNode;
}

export interface ObjKindArray extends UnionNode {
    kind: "array";
    node: ArrayNode;
}

export interface ObjKindName extends UnionNode {
    kind: "name";
    node: NameNode;
}

export interface ObjKindNumber extends UnionNode {
    kind: "number";
    node: NumberNode;
}

export interface ObjKindString extends UnionNode {
    kind: "string";
    node: StringNode;
}

export interface ObjKindNull extends UnionNode {
    kind: "null";
    node: NullObjectNode;
}
