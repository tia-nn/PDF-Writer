import React from "react";
import './Viewer.css';
import BuiltinViewer from "./viewer/BuiltinViewer";
import { useThrottle } from "ahooks";
import DebugViewer from "./viewer/DebugViewer";

type Props = {
    value: string;
    type: "iframe" | "tree";
}

const Viewer: React.FC<Props> = (props: Props) => {
    const { value, type } = useThrottle(props, { wait: 500, leading: false });

    return (<section className="viewer-main">
        {(() => {
            if (type == "tree") {
                return <DebugViewer value={value}></DebugViewer>;
            } else {
                return <BuiltinViewer value={value}></BuiltinViewer>;
            }
        })()}
    </section>);
}

export default Viewer;
