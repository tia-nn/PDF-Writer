import './PDFjs.css';
import { useState, useRef } from 'react';
import { usePdf } from '@mikecousins/react-pdf';

/**
 *
 * @param {Object} props
 * @param {string} props.url
 * @returns {JSX.Element}
 */
function PDFjsViewer({ url }) {

    throw 'TODO';

    const [page, setPage] = useState(1);
    const canvasRef = useRef(null);

    const { pdfDocument, pdfPage } = usePdf({
        file: url,
        page,
        canvasRef,
    });

    return (
        <section className="viewer-pdfjs"></section>
    );
}

export default PDFjsViewer;
