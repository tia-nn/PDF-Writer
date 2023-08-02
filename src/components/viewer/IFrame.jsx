import './IFrame.css';

/**
 *
 * @param {Object} props
 * @param {string} props.url
 * @returns {JSX.Element}
 */
function IFrameViewer({ url }) {
    return (
        <iframe className="viewer-iframe" src={url}></iframe>
    );
}

export default IFrameViewer;
