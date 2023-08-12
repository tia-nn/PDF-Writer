import antlr4 from "antlr4";
import PDFLexer from "../../parser/antlr/dist/PDFLexer";
import PDFParser from "../../parser/antlr/dist/PDFParser";
import { ASTBuilder } from "../../parser/ast/ASTBuilder";
import { stringify } from "flatted";

/**
 * @param {MessageEvent<string>} e
 */
onmessage = function (e) {
    const source = e.data;

    const chars = antlr4.CharStreams.fromString(source);
    const lexer = new PDFLexer(chars);
    const tokens = new antlr4.CommonTokenStream(lexer);
    const parser = new PDFParser(tokens);
    parser.buildParseTrees = true;
    const tree = parser.start();

    const builder = new ASTBuilder(source);
    const ast = builder.visit(tree);

    postMessage([source, stringify(ast)]);
};
