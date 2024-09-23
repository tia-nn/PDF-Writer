import { BasePDFParserListener } from "./BasePDFParserListener";
import { StreamContext } from "../antlr/dist/PDFParser";
import { LocIndex } from "../types";

export class StreamParser extends BasePDFParserListener {
    streams: LocIndex[] = [];

    public result(): LocIndex[] {
        return this.streams;
    }

    exitStream?: ((ctx: StreamContext) => void) = (ctx) => {
        this.streams.push({
            uri: "file://main.pdf",
            range: this.range(ctx),
        });
    };
}
