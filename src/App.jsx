import { useCallback, useEffect, useState } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Header from './components/Header';
import Writer from './components/Writer';
import Viewer from './components/Viewer';
import { Col, Container, Row } from 'react-bootstrap';

function App() {
    const [value, setValue] = useState(toAsciiString(defaultValue));

    const handleChange = useCallback((newValue) => {
        setValue(toAsciiString(newValue));
    }, []);

    return (
        <>
            <div className='app-container'>
                <Header></Header>
                <Container fluid className='main-container'>
                    <Row className='main-row'>
                        <Col className='writer-col'><Writer
                            value={value}
                            autoXref={false}
                            onChange={handleChange}
                        ></Writer></Col>
                        <Col className='viewer-col'><Viewer
                            value={value}
                        ></Viewer></Col>
                    </Row>
                </Container>
            </div>
        </>
    );
}

/** @param {string} s */
function toAsciiString(s) {
    return new TextDecoder('ascii').decode(stringToAsciiUint8Array(s));
}

function stringToAsciiUint8Array(inputString) {
    const uint8array = new Uint8Array(inputString.length * 2);
    let ii = 0;
    for (let i = 0; i < inputString.length; i++) {
        const charCode = inputString.charCodeAt(i);
        if (charCode > 256) {
            uint8array[ii++] = charCode >>> 8;
        }
        uint8array[ii++] = charCode & 0xff;
    }
    return uint8array.subarray(0, ii);
}

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
`;

export default App;
