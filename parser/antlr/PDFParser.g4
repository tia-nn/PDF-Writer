parser grammar PDFParser;
options {
	tokenVocab = PDFLexer;
}

// TODO: incremental update に対応
start: H_PDF body xref_section trailer;

body: indirect_object_define*;

// comment: COMMENT_PREFIX COMMENT_CONTENT?;

object:
	indirect_reference
	| stream
	| dict
	| array
	| name
	| number
	| string
	| null_obj;

// number

number: integer | real;
integer: INTEGER;
real: FLOAT;
name: NAME_PREFIX name_content*;
name_content: NAME_ESCAPE | NAME_ESC_INVALID | NAME_CONTENT;

// string
string: literal_string | hex_string;
literal_string:
	LSTR_QUOTE_OPEN literal_string_content* LSTR_QUOTE_CLOSE;
literal_string_content:
	escape_sequence
	| literal_string_inner
	| INVALID_ESCAPE
	| LSTR_CONTENT;
literal_string_inner:
	LSTR_QUOTE_OPEN_INNER literal_string_content* LSTR_QUOTE_CLOSE;
escape_sequence: ESCAPE_CHAR | ESCAPE_OCTAL | ESCAPE_NEWLINE;

hex_string:
	HSTR_QUOTE_OPEN hex_string_content* HSTR_QUOTE_CLOSE;
hex_string_content: HSTR_CONTENT | HSTR_INVALID;

// null

null_obj: K_NULL;

// array

array: ARRAY_OPEN object* ARRAY_CLOSE;

// dict

dict: DICT_OPEN dict_pair* DICT_CLOSE;
dict_pair: name object?;

// stream

stream: dict? stream_main;
stream_main: K_STREAM STREAM_CONTENT_ENDSTREAM;

// indirect object
indirect_object_define:
	integer? integer? K_OBJ object? K_ENDOBJ;

// indirect reference
indirect_reference: integer? integer? K_R;

// xref

// 固定フォーマットの検証は AST 作成のタイミングで対応する

xref_section: K_XREF xref_subsection*;

xref_subsection: xref_subsection_header xref_entry*;
xref_subsection_header: integer integer;
xref_entry: integer integer xref_type;
xref_type: XREF_TYPE_N | XREF_TYPE_F;

// trailer

trailer: K_TRAILER dict? K_STARTXREF? integer? H_EOF?;
