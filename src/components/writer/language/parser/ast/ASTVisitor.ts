import { ArrayNode } from "./ast/array";
import { DictNode, DictPairNode } from "./ast/dict";
import { BodyNode } from "./ast/doby";
import { IndirectDefineNode, IndirectReferenceNode } from "./ast/indirect";
import { NameContentNode, NameNode } from "./ast/name";
import { NullObjectNode } from "./ast/null";
import { IntegerNode, NumberNode, RealNode } from "./ast/number";
import { ObjectNode } from "./ast/object";
import { StartNode } from "./ast/start";
import { StreamMainNode, StreamNode } from "./ast/stream";
import { HStrContentNode, HStringNode, LStrContentNode, LStrEscapeNode, LStringNode, StringNode } from "./ast/string";
import { TrailerNode } from "./ast/trailer";
import { XRefEntryNode, XRefSectionNode, XRefSubsectionHeaderNode, XRefSubsectionNode, XRefTypeNode } from "./ast/xref";

export class ASTVisitor<T>{

    visitStart?(node: StartNode, ...args): T;

    visitBody?(node: BodyNode, ...args): T;

    visitIndirectDefine?(node: IndirectDefineNode, ...args): T;

    visitObject?(node: ObjectNode, ...args): T;

    // Number

    visitNumber?(node: NumberNode, ...args): T;

    visitInteger?(node: IntegerNode, ...args): T;

    visitReal?(node: RealNode, ...args): T;

    // Name

    visitName?(node: NameNode, ...args): T;

    visitNameContent?(node: NameContentNode, ...args): T;

    // String

    visitString?(node: StringNode, ...args): T;

    visitLString?(node: LStringNode, ...args): T;

    visitLStrContent?(node: LStrContentNode, ...args): T;

    visitLStrEscape?(node: LStrEscapeNode, ...args): T;

    visitHString?(node: HStringNode, ...args): T;

    visitHStrContent?(node: HStrContentNode, ...args): T;

    // null

    visitNullObject?(node: NullObjectNode, ...args): T;

    // array

    visitArray?(node: ArrayNode, ...args): T;

    // dict

    visitDict?(node: DictNode, ...args): T;

    visitDictPair?(node: DictPairNode, ...args): T;

    // stream

    visitStream?(node: StreamNode, ...args): T;

    visitStreamMain?(node: StreamMainNode, ...args): T;

    // R

    visitIndirectReference?(node: IndirectReferenceNode, ...args): T;

    // xref

    visitXrefSection?(node: XRefSectionNode, ...args): T;

    visitXrefSubsection?(node: XRefSubsectionNode, ...args): T;

    visitXrefSubsectionHeader?(node: XRefSubsectionHeaderNode, ...args): T;

    visitXrefEntry?(node: XRefEntryNode, ...args): T;

    visitXrefType?(node: XRefTypeNode, ...args): T;

    // trailer

    visitTrailer?(node: TrailerNode, ...args): T;

};
