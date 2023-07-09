import './Viewer.css'

/**
 *
 * @param {Object} props
 * @param {string} props.value
 * @returns {JSX.Element}
 */
function Viewer({ value }) {

    const pdf = new Blob([value], { type: "application/pdf" })
    const url = URL.createObjectURL(pdf)

    return (<section className="viewer-main">
        <iframe className="viewer-iframe" src={url}></iframe>
    </section>);
}

export default Viewer;
