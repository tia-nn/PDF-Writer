import antlr4 from "antlr4";
import PDFLexer from "../../../../parser/antlr/dist/PDFLexer";
import PDFParser, { StartContext } from "../../../../parser/antlr/dist/PDFParser";
import { ASTVisitor } from "../../../../parser/ast/ast-visitor";
import { StartNode } from "../../../../parser/ast/ast/start";
import { Scope } from "../../../../parser/ast/ast/scope";
import { BaseASTNode, ErrorReport } from "../../../../parser/ast/ast/base";
import { resolve } from "path";


export function tree(v: string): StartContext {
    const chars = antlr4.CharStreams.fromString(v);
    const lexer = new PDFLexer(chars);
    const tokens = new antlr4.CommonTokenStream(lexer);
    const parser = new PDFParser(tokens);
    parser.buildParseTrees = true;
    const tree = parser.start();

    return tree;
}

export function treePromise(v: string): Promise<StartContext> {
    return new Promise(function (resolve) {
        setTimeout(() => resolve(tree(v)), 0);
    });
}

export function parseTree(src: string, t: StartContext): StartNode {
    const ast = new ASTVisitor(src).visit(t);

    return ast as StartNode;
}

export function parse(v: string): [StartContext, StartNode, ErrorReport[]] {
    const t = tree(v);

    const parser = new ASTVisitor(v);
    const ast = parser.visit(t);

    return [t, ast as StartNode, parser.errors];
}

export function parsePromise(v: string): Promise<[StartContext, StartNode, ErrorReport[]]> {
    return new Promise(function (resolve) {
        setTimeout(() => resolve(parse(v)), 0);
    });
}

// export function scope(node: StartNode, pos: number): Scope {
//     if (inRange(node, pos)) {
//         if (node.src.trailer && node.src.trailer.src.dict && inRangeBetween(node.src.trailer.src.dict.position.start + 1, node.src.trailer.src.dict.position.stop, pos)) {

//             const dict = node.src.trailer.src.dict;
//             if (dict.src == null) {
//                 return {
//                     kind: "others",
//                     node: node,
//                 };
//             }

//             for (let i = 0; i < dict.src.contents.length; i++) {
//                 const c = dict.src.contents[i];
//                 if (!inRange(c, pos)) {
//                     continue;
//                 }
//                 if (c.src == null) {
//                     return {
//                         kind: "others",
//                         node: node,
//                     };
//                 }
//                 const key = c.src.name;
//                 const value = c.src.object;
//                 if (inRange(key, pos)) {
//                     return {
//                         kind: "trailerdict",
//                         node: node.src.trailer.src.dict,
//                         state: { kind: "key" },
//                     };
//                 } else {
//                     return {
//                         kind: "trailerdict",
//                         node: node.src.trailer.src.dict,
//                         state: { kind: "value", key: key },
//                     };
//                 }
//             }

//             return {
//                 kind: "trailerdict",
//                 node: node.src.trailer.src.dict,
//                 state: { kind: "key" },
//             };
//         }

//         return {
//             kind: "others",
//             node: node,
//         };
//     } else {
//         return {
//             kind: "others",
//             node: node,
//         };
//     }
// }

function inRange(node: BaseASTNode, pos: number) {
    return node.position.start + 1 <= pos && pos < node.position.stop + 2;
}

function inRangeBetween(start: number, end: number, pos: number) {
    return start < pos && pos < end;
}
