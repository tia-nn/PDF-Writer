import { useEffect, useRef, useState } from "react";
import './Viewer.css';
import IFrameViewer from "./viewer/IFrame";
import PDFjsViewer from "./viewer/PDFjs";
import ParserDebug from './viewer/ParserDebug';

/**
 *
 * @param {Object} props
 * @param {string} props.value
 * @param {"iframe" | "tree"} props.type
 * @returns {JSX.Element}
 */
function Viewer({ value, type }) {

    const [currentViewer, setCurrentViewer] = useState(<></>);
    const timeoutID = useRef(0);

    // TODO: throttle にする
    useEffect(() => {
        clearTimeout(timeoutID.current);
        timeoutID.current = setTimeout(() => { setCurrentViewer(viewer(type, value)); }, 500);
    }, [value, type]);

    return (<section className="viewer-main">
        {currentViewer}
    </section>);
}

function viewer(type, value) {

    if (type == "tree") {
        return <ParserDebug text={value}></ParserDebug>;
    } else {
        const pdf = new Blob([value], { type: "application/pdf" });
        const url = URL.createObjectURL(pdf);
        return <IFrameViewer url={url}></IFrameViewer>;
    }
}

export default Viewer;
