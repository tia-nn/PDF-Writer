import antlr4, { ParseTreeWalker } from "antlr4";
import PDFLexer from "../writer/language/parser/antlr/dist/PDFLexer";
import PDFParser, { StartContext } from "../writer/language/parser/antlr/dist/PDFParser";
import { ASTBuilder } from "../writer/language/parser/ast/ASTBuilder";
import { ASTDebugNodeBuilder, ContextDebugNodeBuildListener } from "../writer/language/parser/ast/DebugNodeBuilder";
import { stringify } from "flatted";
import { StartNode } from "../writer/language/parser/ast/ast/start";

onmessage = (e: MessageEvent<string>) => {
    const source = e.data;

    const tree: StartContext | undefined = (() => {
        try {
            const chars = antlr4.CharStreams.fromString(source);
            const lexer = new PDFLexer(chars);
            const tokens = new antlr4.CommonTokenStream(lexer);
            const parser = new PDFParser(tokens);
            parser.buildParseTrees = true;
            const tree = parser.start();
            return tree;
        } catch (e) {
            return undefined;
        }
    })();

    const ast: StartNode | undefined = tree ? (() => {
        const builder = new ASTBuilder(source);
        const ast = builder.visit(tree) as StartNode;

        return ast;
    })() : undefined;


    const ret = [undefined as any, undefined as any];
    if (tree) {
        const walker = new ContextDebugNodeBuildListener();
        ParseTreeWalker.DEFAULT.walk(walker, tree);
        const contextDebugNode = walker.currentNode;
        ret[0] = stringify(contextDebugNode);
    }
    if (ast) {
        const astDebugNode = new ASTDebugNodeBuilder().build(ast);
        ret[1] = stringify(astDebugNode);
    }

    postMessage(ret);

};
