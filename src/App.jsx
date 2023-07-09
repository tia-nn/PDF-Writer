import { useCallback, useState } from 'react'
import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import Header from './components/Header'
import Writer from './components/Writer'
import Viewer from './components/Viewer'
import { Col, Container, Row } from 'react-bootstrap'

function App() {
    const [value, setValue] = useState(defaultValue);

    const handleChange = useCallback((newValue) => {
        setValue(newValue);
    }, []);

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
    )
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
0000000015 00000 n
0000000074 00000 n
0000000182 00000 n
0000000281 00000 n
0000000402 00000 n
trailer

<<
/Root 5 0 R
/Size 6
>>
startxref
452
%%EOF
`

export default App
