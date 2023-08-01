import './Viewer.css';
import IFrameViewer from "./viewer/IFrame";
import PDFjsViewer from "./viewer/PDFjs";

/**
 *
 * @param {Object} props
 * @param {string} props.value
 * @returns {JSX.Element}
 */
function Viewer({ value }) {

    const pdf = new Blob([value], { type: "application/pdf" });
    const url = URL.createObjectURL(pdf);

    return (<section className="viewer-main">
        <IFrameViewer url={url}></IFrameViewer>
    </section>);
}

export default Viewer;
