import { useEffect, useState } from 'react';
import './BuiltinViewer.css';
import { encodeUTF16BEA } from '@/tools/encoding';

const BuiltinViewer: React.FC<{ value: string }> = ({ value }) => {
    const [url, setUrl] = useState<string | null>();

    useEffect(() => {
        const pdf = new Blob([encodeUTF16BEA(value)], { type: "application/pdf" });
        const url = URL.createObjectURL(pdf);
        setUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [value]);

    return url ? (
        <iframe className="viewer-iframe" src={url}></iframe>
    ) : null;
}

export default BuiltinViewer;
