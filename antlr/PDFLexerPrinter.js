// import ParseTreeListener from "antlr4/tree/ParseTreeListener";
import antlr4 from 'antlr4'
import PDFLexer from './dist/PDFLexer';
import PDFParserListener from './dist/PDFParserListener';

const padding = "                ";

export default class PDFLexerPrinter extends PDFParserListener {
    constructor() {
        super();
    }

    /**@param {antlr4.tree.TerminalNode} node */
    visitTerminal(node) {
        const s = node.getSymbol()
        console.log(`${(PDFLexer.symbolicNames[s.type] + padding).slice(0, padding.length)}"${node.getText()}"`)
    }
}
