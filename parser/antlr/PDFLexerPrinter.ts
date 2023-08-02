// import ParseTreeListener from "antlr4/tree/ParseTreeListener";
import antlr4, { TerminalNode } from 'antlr4'
import PDFLexer from './dist/PDFLexer';
import PDFParserListener from './dist/PDFParserListener';

const padding = "                ";

export default class PDFLexerPrinter extends PDFParserListener {
    constructor() {
        super();
    }

    visitTerminal(node: TerminalNode) {
        const s = node.symbol;
        console.log(`${(PDFLexer.symbolicNames[s.type] + padding).slice(0, padding.length)}"${node.getText()}"`);
    }
}
