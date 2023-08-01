import { ParseTree, ParserRuleContext } from "antlr4";
import { BodyContext, Indirect_object_defineContext, Indirect_referenceContext } from "../antlr/dist/PDFParser";
import PDFParserListener from "../antlr/dist/PDFParserListener";
import PDFParserVisitor from "../antlr/dist/PDFParserVisitor";
import { ASTVisitor } from "./ast-visitor";
import { BaseASTNode } from "./ast/base";
import { IndirectDefineNode } from "./ast/indirect";

export class DetectIndirectDefines extends PDFParserVisitor<IndirectDefineNode[]> {

    visit(ctx: ParseTree): IndirectDefineNode[] {
        if (Array.isArray(ctx)) {
            return ctx.map(function (child) {
                return child.accept(this);
            }, this).flat(Infinity).filter(n => n != null);
        } else {
            return (ctx as any).accept(this);
        }
    }

    visitIndirect_object_define: ((ctx: Indirect_object_defineContext) => IndirectDefineNode[]) = ctx => {
        const astVisitor = new ASTVisitor();

        return [astVisitor.visitIndirect_object_define(ctx)];
    };

}
