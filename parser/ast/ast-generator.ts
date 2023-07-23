// import ParseTreeListener from "antlr4/tree/ParseTreeListener";
import antlr4, { TerminalNode } from 'antlr4'
import PDFLexer from '../antlr/dist/PDFLexer';
import PDFParserListener from '../antlr/dist/PDFParserListener';
import { StartContext } from '../antlr/dist/PDFParser';

export default class PDFParserPrinter extends PDFParserListener {
    /**
     * Enter a parse tree produced by `PDFParser.start`.
     * @param ctx the parse tree
     */
    enterStart?: (ctx: StartContext) => void;
    /**
     * Exit a parse tree produced by `PDFParser.start`.
     * @param ctx the parse tree
     */
    exitStart?: (ctx: StartContext) => void;
    /**
     * Enter a parse tree produced by `PDFParser.header`.
     * @param ctx the parse tree
     */
    enterHeader?: (ctx: HeaderContext) => void;
    /**
     * Exit a parse tree produced by `PDFParser.header`.
     * @param ctx the parse tree
     */
    exitHeader?: (ctx: HeaderContext) => void;
    /**
     * Enter a parse tree produced by `PDFParser.body`.
     * @param ctx the parse tree
     */
    enterBody?: (ctx: BodyContext) => void;
    /**
     * Exit a parse tree produced by `PDFParser.body`.
     * @param ctx the parse tree
     */
    exitBody?: (ctx: BodyContext) => void;
    /**
     * Enter a parse tree produced by `PDFParser.statement`.
     * @param ctx the parse tree
     */
    enterStatement?: (ctx: StatementContext) => void;
    /**
     * Exit a parse tree produced by `PDFParser.statement`.
     * @param ctx the parse tree
     */
    exitStatement?: (ctx: StatementContext) => void;
    /**
     * Enter a parse tree produced by `PDFParser.object`.
     * @param ctx the parse tree
     */
    enterObject?: (ctx: ObjectContext) => void;
    /**
     * Exit a parse tree produced by `PDFParser.object`.
     * @param ctx the parse tree
     */
    exitObject?: (ctx: ObjectContext) => void;
    /**
     * Enter a parse tree produced by `PDFParser.number`.
     * @param ctx the parse tree
     */
    enterNumber?: (ctx: NumberContext) => void;
    /**
     * Exit a parse tree produced by `PDFParser.number`.
     * @param ctx the parse tree
     */
    exitNumber?: (ctx: NumberContext) => void;
    /**
     * Enter a parse tree produced by `PDFParser.integer`.
     * @param ctx the parse tree
     */
    enterInteger?: (ctx: IntegerContext) => void;
    /**
     * Exit a parse tree produced by `PDFParser.integer`.
     * @param ctx the parse tree
     */
    exitInteger?: (ctx: IntegerContext) => void;
    /**
     * Enter a parse tree produced by `PDFParser.real`.
     * @param ctx the parse tree
     */
    enterReal?: (ctx: RealContext) => void;
    /**
     * Exit a parse tree produced by `PDFParser.real`.
     * @param ctx the parse tree
     */
    exitReal?: (ctx: RealContext) => void;
    /**
     * Enter a parse tree produced by `PDFParser.name`.
     * @param ctx the parse tree
     */
    enterName?: (ctx: NameContext) => void;
    /**
     * Exit a parse tree produced by `PDFParser.name`.
     * @param ctx the parse tree
     */
    exitName?: (ctx: NameContext) => void;
    /**
     * Enter a parse tree produced by `PDFParser.name_content`.
     * @param ctx the parse tree
     */
    enterName_content?: (ctx: Name_contentContext) => void;
    /**
     * Exit a parse tree produced by `PDFParser.name_content`.
     * @param ctx the parse tree
     */
    exitName_content?: (ctx: Name_contentContext) => void;
    /**
     * Enter a parse tree produced by `PDFParser.string`.
     * @param ctx the parse tree
     */
    enterString?: (ctx: StringContext) => void;
    /**
     * Exit a parse tree produced by `PDFParser.string`.
     * @param ctx the parse tree
     */
    exitString?: (ctx: StringContext) => void;
    /**
     * Enter a parse tree produced by `PDFParser.literal_string`.
     * @param ctx the parse tree
     */
    enterLiteral_string?: (ctx: Literal_stringContext) => void;
    /**
     * Exit a parse tree produced by `PDFParser.literal_string`.
     * @param ctx the parse tree
     */
    exitLiteral_string?: (ctx: Literal_stringContext) => void;
    /**
     * Enter a parse tree produced by `PDFParser.literal_string_content`.
     * @param ctx the parse tree
     */
    enterLiteral_string_content?: (ctx: Literal_string_contentContext) => void;
    /**
     * Exit a parse tree produced by `PDFParser.literal_string_content`.
     * @param ctx the parse tree
     */
    exitLiteral_string_content?: (ctx: Literal_string_contentContext) => void;
    /**
     * Enter a parse tree produced by `PDFParser.literal_string_inner`.
     * @param ctx the parse tree
     */
    enterLiteral_string_inner?: (ctx: Literal_string_innerContext) => void;
    /**
     * Exit a parse tree produced by `PDFParser.literal_string_inner`.
     * @param ctx the parse tree
     */
    exitLiteral_string_inner?: (ctx: Literal_string_innerContext) => void;
    /**
     * Enter a parse tree produced by `PDFParser.escape_sequence`.
     * @param ctx the parse tree
     */
    enterEscape_sequence?: (ctx: Escape_sequenceContext) => void;
    /**
     * Exit a parse tree produced by `PDFParser.escape_sequence`.
     * @param ctx the parse tree
     */
    exitEscape_sequence?: (ctx: Escape_sequenceContext) => void;
    /**
     * Enter a parse tree produced by `PDFParser.hex_string`.
     * @param ctx the parse tree
     */
    enterHex_string?: (ctx: Hex_stringContext) => void;
    /**
     * Exit a parse tree produced by `PDFParser.hex_string`.
     * @param ctx the parse tree
     */
    exitHex_string?: (ctx: Hex_stringContext) => void;
    /**
     * Enter a parse tree produced by `PDFParser.hex_string_content`.
     * @param ctx the parse tree
     */
    enterHex_string_content?: (ctx: Hex_string_contentContext) => void;
    /**
     * Exit a parse tree produced by `PDFParser.hex_string_content`.
     * @param ctx the parse tree
     */
    exitHex_string_content?: (ctx: Hex_string_contentContext) => void;
    /**
     * Enter a parse tree produced by `PDFParser.null_obj`.
     * @param ctx the parse tree
     */
    enterNull_obj?: (ctx: Null_objContext) => void;
    /**
     * Exit a parse tree produced by `PDFParser.null_obj`.
     * @param ctx the parse tree
     */
    exitNull_obj?: (ctx: Null_objContext) => void;
    /**
     * Enter a parse tree produced by `PDFParser.array`.
     * @param ctx the parse tree
     */
    enterArray?: (ctx: ArrayContext) => void;
    /**
     * Exit a parse tree produced by `PDFParser.array`.
     * @param ctx the parse tree
     */
    exitArray?: (ctx: ArrayContext) => void;
    /**
     * Enter a parse tree produced by `PDFParser.dict`.
     * @param ctx the parse tree
     */
    enterDict?: (ctx: DictContext) => void;
    /**
     * Exit a parse tree produced by `PDFParser.dict`.
     * @param ctx the parse tree
     */
    exitDict?: (ctx: DictContext) => void;
    /**
     * Enter a parse tree produced by `PDFParser.dict_pair`.
     * @param ctx the parse tree
     */
    enterDict_pair?: (ctx: Dict_pairContext) => void;
    /**
     * Exit a parse tree produced by `PDFParser.dict_pair`.
     * @param ctx the parse tree
     */
    exitDict_pair?: (ctx: Dict_pairContext) => void;
    /**
     * Enter a parse tree produced by `PDFParser.stream`.
     * @param ctx the parse tree
     */
    enterStream?: (ctx: StreamContext) => void;
    /**
     * Exit a parse tree produced by `PDFParser.stream`.
     * @param ctx the parse tree
     */
    exitStream?: (ctx: StreamContext) => void;
    /**
     * Enter a parse tree produced by `PDFParser.stream_main`.
     * @param ctx the parse tree
     */
    enterStream_main?: (ctx: Stream_mainContext) => void;
    /**
     * Exit a parse tree produced by `PDFParser.stream_main`.
     * @param ctx the parse tree
     */
    exitStream_main?: (ctx: Stream_mainContext) => void;
    /**
     * Enter a parse tree produced by `PDFParser.indirect_object_define`.
     * @param ctx the parse tree
     */
    enterIndirect_object_define?: (ctx: Indirect_object_defineContext) => void;
    /**
     * Exit a parse tree produced by `PDFParser.indirect_object_define`.
     * @param ctx the parse tree
     */
    exitIndirect_object_define?: (ctx: Indirect_object_defineContext) => void;
    /**
     * Enter a parse tree produced by `PDFParser.indirct_reference`.
     * @param ctx the parse tree
     */
    enterIndirct_reference?: (ctx: Indirct_referenceContext) => void;
    /**
     * Exit a parse tree produced by `PDFParser.indirct_reference`.
     * @param ctx the parse tree
     */
    exitIndirct_reference?: (ctx: Indirct_referenceContext) => void;
    /**
     * Enter a parse tree produced by `PDFParser.xref_section`.
     * @param ctx the parse tree
     */
    enterXref_section?: (ctx: Xref_sectionContext) => void;
    /**
     * Exit a parse tree produced by `PDFParser.xref_section`.
     * @param ctx the parse tree
     */
    exitXref_section?: (ctx: Xref_sectionContext) => void;
    /**
     * Enter a parse tree produced by `PDFParser.xref_subsection`.
     * @param ctx the parse tree
     */
    enterXref_subsection?: (ctx: Xref_subsectionContext) => void;
    /**
     * Exit a parse tree produced by `PDFParser.xref_subsection`.
     * @param ctx the parse tree
     */
    exitXref_subsection?: (ctx: Xref_subsectionContext) => void;
    /**
     * Enter a parse tree produced by `PDFParser.xref_subsection_header`.
     * @param ctx the parse tree
     */
    enterXref_subsection_header?: (ctx: Xref_subsection_headerContext) => void;
    /**
     * Exit a parse tree produced by `PDFParser.xref_subsection_header`.
     * @param ctx the parse tree
     */
    exitXref_subsection_header?: (ctx: Xref_subsection_headerContext) => void;
    /**
     * Enter a parse tree produced by `PDFParser.xref_entry`.
     * @param ctx the parse tree
     */
    enterXref_entry?: (ctx: Xref_entryContext) => void;
    /**
     * Exit a parse tree produced by `PDFParser.xref_entry`.
     * @param ctx the parse tree
     */
    exitXref_entry?: (ctx: Xref_entryContext) => void;
    /**
     * Enter a parse tree produced by `PDFParser.xref_header`.
     * @param ctx the parse tree
     */
    enterXref_header?: (ctx: Xref_headerContext) => void;
    /**
     * Exit a parse tree produced by `PDFParser.xref_header`.
     * @param ctx the parse tree
     */
    exitXref_header?: (ctx: Xref_headerContext) => void;
    /**
     * Enter a parse tree produced by `PDFParser.xref_type`.
     * @param ctx the parse tree
     */
    enterXref_type?: (ctx: Xref_typeContext) => void;
    /**
     * Exit a parse tree produced by `PDFParser.xref_type`.
     * @param ctx the parse tree
     */
    exitXref_type?: (ctx: Xref_typeContext) => void;
    /**
     * Enter a parse tree produced by `PDFParser.trailer`.
     * @param ctx the parse tree
     */
    enterTrailer?: (ctx: TrailerContext) => void;
    /**
     * Exit a parse tree produced by `PDFParser.trailer`.
     * @param ctx the parse tree
     */
    exitTrailer?: (ctx: TrailerContext) => void;
    /**
     * Enter a parse tree produced by `PDFParser.trailer_header`.
     * @param ctx the parse tree
     */
    enterTrailer_header?: (ctx: Trailer_headerContext) => void;
    /**
     * Exit a parse tree produced by `PDFParser.trailer_header`.
     * @param ctx the parse tree
     */
    exitTrailer_header?: (ctx: Trailer_headerContext) => void;
    /**
     * Enter a parse tree produced by `PDFParser.startxref`.
     * @param ctx the parse tree
     */
    enterStartxref?: (ctx: StartxrefContext) => void;
    /**
     * Exit a parse tree produced by `PDFParser.startxref`.
     * @param ctx the parse tree
     */
    exitStartxref?: (ctx: StartxrefContext) => void;
    /**
     * Enter a parse tree produced by `PDFParser.eof_marker`.
     * @param ctx the parse tree
     */
    enterEof_marker?: (ctx: Eof_markerContext) => void;
    /**
     * Exit a parse tree produced by `PDFParser.eof_marker`.
     * @param ctx the parse tree
     */
    exitEof_marker?: (ctx: Eof_markerContext) => void;
}
