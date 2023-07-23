// import ParseTreeListener from "antlr4/tree/ParseTreeListener";
import antlr4 from 'antlr4'
import PDFLexer from './dist/PDFLexer';
import PDFParserListener from './dist/PDFParserListener';

/**
* @typedef {import('antlr4/tree/TerminalNode').default} TerminalNode
*/

export default class PDFListener extends PDFParserListener {
    constructor() {
        super();
    }

    /**@param {TerminalNode} node */
    visitTerminal(node) {
    }
}

export class PDFLexerWalker extends PDFParserListener {
    constructor() {
        super();
    }

    /**@param {TerminalNode} node */
    visitTerminal(node) {
        const s = node.getSymbol()
        console.log(PDFLexer.symbolicNames[s.type])
        console.log(`"${node.getText()}"`)
    }
}
