import { IntegerContext } from "../antlr/dist/PDFParser";
import PDFParserVisitor from "../antlr/dist/PDFParserVisitor";
import { ASTNode, IntegerNode } from "./ast";

export class ASTVisitor extends PDFParserVisitor<ASTNode> {
    visitInteger?: ((ctx: IntegerContext) => ASTNode) | undefined = ctx => {
        return new IntegerNode(ctx);
    };
}
