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
    const [value, setValue] = useState((HelloWorld));
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
                        <Col className='writer-col'>
                            <Writer
                                value={value}
                                onChange={handleChange}
                            ></Writer>
                        </Col>
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

export default App;
