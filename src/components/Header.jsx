import { Button, Col, Container, NavDropdown, Navbar, Row } from "react-bootstrap";


/** @typedef {import("../App").Options} Options */
/**
 * @param {Object} props
 * @param {Options} props.value
 * @param {function(Options):void} props.onChange
 * @param {function("Hello, World!" | "XObject" | "JPEG Image")} props.onSelectTemplate
 * @returns
 */
function Header({ value, onChange, onSelectTemplate }) {
    return (<Navbar className='header'>
        <Container fluid>
            <Row>
                <Col>
                    <Navbar.Brand>PDF Live Editor</Navbar.Brand>
                </Col>

                <Col>
                    <NavDropdown title="template">
                        <NavDropdown.Item onClick={() => { if (onSelectTemplate) onSelectTemplate("Hello, World!"); }}>Hello, World!</NavDropdown.Item>
                        <NavDropdown.Item onClick={() => { if (onSelectTemplate) onSelectTemplate("XObject"); }}>XObject</NavDropdown.Item>
                        <NavDropdown.Item onClick={() => { if (onSelectTemplate) onSelectTemplate("JPEG Image"); }}>JPEG Image</NavDropdown.Item>
                    </NavDropdown>
                </Col>

                <Col>
                    <NavDropdown title="Viewer">
                        <NavDropdown.Item onClick={() => { if (onChange) onChange({ writer: value.writer, viewer: { type: "iframe" } }); }}>Builtin</NavDropdown.Item>
                        <NavDropdown.Item onClick={() => { if (onChange) onChange({ writer: value.writer, viewer: { type: "tree" } }); }}>[Debug] ParseTree</NavDropdown.Item>
                    </NavDropdown>
                </Col>

            </Row>

        </Container>
    </Navbar>);
}

export default Header;
