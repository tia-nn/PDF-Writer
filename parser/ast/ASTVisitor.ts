
export class ASTVisitor {

    visitStart(node) { }

    visitBody(node) { }

    visitIndirectObjectDefine(node) { }

    visitObject(node) { }

    // Number

    visitNumber(node) { }

    visitInteger(node) { }

    visitReal(node) { }

    // Name

    visitName(node) { }

    visitNameContent(node) { }

    // String

    visitString(node) { }

    visitLiteralString(node) { }

    visitLiteralStringContent(node) { }

    visitLiteralStringInner(node) { }

    visitEscapeSequence(node) { }

    visitHexString(node) { }

    visitHexStringContent(node) { }

    // null

    visitNullObj(node) { }

    // array

    visitArray(node) { }

    // dict

    visitDict(node) { }

    visitDictPair(node) { }

    // stream

    visitStream(node) { }

    visitStreamMain(node) { }

    // R

    visitIndirectReference(node) { }

    // xref

    visitXrefSection(node) { }

    visitXrefSubsection(node) { }

    visitXrefSubsectionHeader(node) { }

    visitXrefEntry(node) { }

    visitXrefType(node) { }

    // trailer

    visitTrailer(node) { }

}
