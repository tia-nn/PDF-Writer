import { IndirectDefLocations, IndirectRefLocations } from "../types";
import { Indirect_objContext, Indirect_refContext, IntegerContext } from "../antlr/dist/PDFParser";
import { BasePDFParserListener, N } from "./BasePDFParserListener";

export class IndirectParser extends BasePDFParserListener {
    definition: IndirectDefLocations = {};
    reference: IndirectRefLocations = {};

    public result(): { definition: IndirectDefLocations; reference: IndirectRefLocations } {
        return {
            definition: this.definition,
            reference: this.reference,
        };
    }

    exitIndirect_obj: ((ctx: Indirect_objContext) => void) = (ctx) => {
        const objID = ctx.obj_id();
        const [objNum, genNum] = objID.integer_list() as (N<IntegerContext>)[];
        if (objNum != null && genNum != null) {
            const o = this.parseInteger(objNum);
            const g = this.parseInteger(genNum);
            if (this.definition[o] === undefined) {
                this.definition[o] = {};
            }
            this.definition[o][g] = {
                uri: "file://main.pdf",
                range: this.range(ctx),
            };
        }
    };

    exitIndirect_ref?: ((ctx: Indirect_refContext) => void) = (ctx) => {
        const [objNum, genNum] = ctx.integer_list() as (N<IntegerContext>)[];
        if (objNum != null && genNum != null) {
            const o = this.parseInteger(objNum);
            const g = this.parseInteger(genNum);
            if (this.reference[o] === undefined) {
                this.reference[o] = {};
            }
            if (this.reference[o][g] === undefined) {
                this.reference[o][g] = [];
            }

            this.reference[o][g].push({
                uri: "file://main.pdf",
                range: this.range(ctx),
            });
        }
    };
}
