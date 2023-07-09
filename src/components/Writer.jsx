import { useCallback, useEffect, useRef, useState } from "react"
import "./Writer.css"
import { Editor } from '@monaco-editor/react'

/**
 *
 * @param {Object} props
 * @param {string} props.value
 * @param {function(string):void} props.onChange
 * @returns {JSX.Element}
 */
function Writer({ value, onChange }) {

    const handleChange = useCallback((newValue, ev) => {
        if (onChange) onChange(newValue);
    }, []);

    return (<main className="writer-main">
        <Editor className="writer-editor"
            onChange={handleChange}
            value={value}
        ></Editor>
    </main>);
}

export default Writer;
