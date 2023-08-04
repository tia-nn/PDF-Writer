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

    let viewer;
    if (type == "tree") {
        viewer = <ParserDebug text={value}></ParserDebug>;
    } else {
        const pdf = new Blob([value], { type: "application/pdf" });
        const url = URL.createObjectURL(pdf);
        viewer = <IFrameViewer url={url}></IFrameViewer>;
    }

    return (<section className="viewer-main">
        {viewer}
    </section>);
}

export default Viewer;
