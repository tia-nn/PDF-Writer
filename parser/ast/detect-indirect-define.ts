import { Indirect_object_defineContext } from "../antlr/dist/PDFParser";
import PDFParserListener from "../antlr/dist/PDFParserListener";
import PDFParserVisitor from "../antlr/dist/PDFParserVisitor";
import { IndirectObjectDefineNode } from "./ast";
import { ASTVisitor } from "./ast-visitor";

export class DetectIndirectDefines extends PDFParserListener {
    defines: IndirectObjectDefineNode[] = [];

    enterIndirect_object_define?: ((ctx: Indirect_object_defineContext) => void) | undefined = ctx => {
        this.defines.push(new IndirectObjectDefineNode(ctx));
    };
}
