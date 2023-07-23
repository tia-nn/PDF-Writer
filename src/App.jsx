import { useCallback, useState } from 'react'
import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import Header from './components/Header'
import Writer from './components/Writer'
import Viewer from './components/Viewer'
import { Col, Container, Row } from 'react-bootstrap'

import PDFParser from '../parser/antlr/dist/PDFParser'
import PDFLexer from '../parser/antlr/dist/PDFLexer'
import antlr4 from 'antlr4'
import 'antlr4/'
import PDFLexerPrinter from '../parser/antlr/PDFLexerPrinter'

/**
 * @typedef {import('antlr4/tree/TerminalNode').default} TerminalNode
 * @typedef {import('antlr4/context/ParserRuleContext').default} ParserRuleContext
 */

function App() {
    const [value, setValue] = useState(defaultValue);

    const handleChange = useCallback((newValue) => {
        setValue(newValue);
    }, []);

    const chars = new antlr4.InputStream(value);
    const lexer = new PDFLexer(chars);
    const tokens = new antlr4.CommonTokenStream(lexer);
    const parser = new PDFParser(tokens);
    parser.buildParseTrees = true;
    const tree = parser.start();

    const listener = new PDFLexerPrinter();
    antlr4.tree.ParseTreeWalker.DEFAULT.walk(listener, tree);

    // console.log(tree.toStringTree());

    // console.log(tree.getChildCount())

    // for (let i in [...Array(tree.getChildCount())]) {
    //     /**@type {TerminalNode | ParserRuleContext} */
    //     let c = tree.getChild(i)
    //     console.log(c)
    // }

    return (
        <>
            <div className='app-container'>
                <Header></Header>
                <Container fluid className='main-container'>
                    <Row className='main-row'>
                        <Col className='writer-col'><Writer onChange={handleChange} value={value}></Writer></Col>
                        <Col className='viewer-col'><Viewer value={value}></Viewer></Col>
                    </Row>
                </Container>
            </div>
        </>
    );
}

// /**
//  * @param {TerminalNode | ParserRuleContext} t
//  */
// function printNode(t) {

// }


const defaultValue = `%PDF-1.0
%����
1 0 obj
<<
/Kids [2 0 R]
/Type /Pages
/Count 1
>>
endobj
2 0 obj
<<
/Resources 3 0 R
/Type /Page
/Contents [4 0 R]
/Parent 1 0 R
/MediaBox [0 0 612 792]
>>
endobj
3 0 obj
<<
/Font
<<
/F0
<<
/Subtype /Type1
/Type /Font
/BaseFont /Times-Italic
>>
>>
>>
endobj
4 0 obj
<<
/Length 68
>>
stream
1. 0. 0. 1. 50. 700. cm
BT
    /F0 36. Tf
    (Hello, World!) Tj
ET

endstream
endobj
5 0 obj
<<
/Type /Catalog
/Pages 1 0 R
>>
endobj xref
0 6
0000000000 65535 f
0000000023 00000 n
0000000082 00000 n
0000000190 00000 n
0000000289 00000 n
0000000410 00000 n
trailer

<<
/Root 5 0 R
/Size 6
>>
startxref
460
%%EOF
`

export default App
