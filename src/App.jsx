import { useCallback, useEffect, useState } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Header from './components/Header';
import Writer from './components/Writer';
import Viewer from './components/Viewer';
import { Col, Container, Row } from 'react-bootstrap';
import HelloWorld from './samples/HelloWorld.pdf?raw';
import ImageXObject from './samples/ImageXObject.pdf?raw';
import ImageXObjectJpeg from './samples/ImageXObjectJpeg.pdf?raw';

/**
 * @typedef {{ writer: { completeClosingQuote: boolean }, viewer: { type: "iframe" | "tree" } }} Options
 */

function App() {
    const [value, setValue] = useState(toAsciiString(HelloWorld));
    const [options, setOptions] = useState(/**@type {Options}*/{ writer: { completeClosingQuote: true }, viewer: { type: "iframe" } });

    const handleChange = useCallback((newValue) => {
        // setValue(toAsciiString(newValue));
        setValue(newValue);
    }, []);

    const handleChangeOptions = useCallback((newOptions) => {
        setOptions(newOptions);
    });

    const handleSelectTemplate = useCallback((/** @type {"Hello, World!" | "XObject" | "JPEG Image"} */ t) => {
        if (t === "Hello, World!")
            setValue(HelloWorld);
        else if (t === "XObject")
            setValue(ImageXObject);
        else if (t === "JPEG Image")
            setValue(ImageXObjectJpeg);
    });

    return (
        <>
            <div className='app-container'>
                <Header value={options} onChange={handleChangeOptions} onSelectTemplate={handleSelectTemplate}></Header>
                <Container fluid className='main-container'>
                    <Row className='main-row'>
                        <Col className='writer-col'><Writer
                            value={value}
                            onChange={handleChange}
                            options={{
                                autofillXrefTable: false,
                                completeClosingQuote: true,
                            }}
                        ></Writer></Col>
                        <Col className='viewer-col'><Viewer
                            value={value}
                            type={options.viewer.type}
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

export default App;
