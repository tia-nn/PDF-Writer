import antlr4 from "antlr4";
import PDFLexer from "../../../../parser/antlr/dist/PDFLexer";
import PDFParser from "../../../../parser/antlr/dist/PDFParser";
import { ASTVisitor } from "../../../../parser/ast/ast-visitor";


export function parse(v: string) {
    const chars = new antlr4.CharStream(v);
    const lexer = new PDFLexer(chars);
    const tokens = new antlr4.CommonTokenStream(lexer);
    const parser = new PDFParser(tokens);
    parser.buildParseTrees = true;
    const tree = parser.start();

    /** @type {import("../../parser/ast/ast/start").StartNode} */
    const ast = new ASTVisitor().visit(tree);

    return [tree, ast];
}
