import antlr4, { ParseTreeWalker } from "antlr4";
import PDFLexer from "../../../parser/antlr/dist/PDFLexer";
import PDFParser from "../../../parser/antlr/dist/PDFParser";
import { ASTBuilder } from "../../../parser/ast/ASTBuilder";
import { ASTDebugNodeBuilder, ContextDebugNodeBuildListener } from "../../../parser/ast/DebugNodeBuilder";
import { stringify } from "flatted";
import { StartNode } from "../../../parser/ast/ast/start";

onmessage = (e: MessageEvent<string>) => {
    const source = e.data;

    const chars = antlr4.CharStreams.fromString(source);
    const lexer = new PDFLexer(chars);
    const tokens = new antlr4.CommonTokenStream(lexer);
    const parser = new PDFParser(tokens);
    parser.buildParseTrees = true;
    const tree = parser.start();

    const builder = new ASTBuilder(source);
    const ast = builder.visit(tree) as StartNode;

    const walker = new ContextDebugNodeBuildListener();
    ParseTreeWalker.DEFAULT.walk(walker, tree);
    const contextDebugNode = walker.currentNode;

    const astDebugNode = new ASTDebugNodeBuilder().build(ast);

    postMessage([stringify(contextDebugNode), stringify(astDebugNode)]);
};
