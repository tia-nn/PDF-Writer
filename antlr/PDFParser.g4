parser grammar PDFParser;
options {
	tokenVocab = PDFLexer;
}

start: statement+;

header: H_PDF;

// statement: comment | object | unexpected;
statement: object | unexpected | header;

// comment: COMMENT_PREFIX COMMENT_CONTENT?;

object:
	indirct_reference
	| indirect_object_define
	| stream
	| dict
	| array
	| name
	| number
	| string
	| null_obj;

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
	HSTR_QUOTE_OPEN hex_string_content? HSTR_QUOTE_CLOSE;
hex_string_content: HSTR_CONTENT | HSTR_INVALID;

// null

null_obj: K_NULL;

// array

array: ARRAY_OPEN object* ARRAY_CLOSE;

// dict

dict: DICT_OPEN dict_pair* DICT_CLOSE;
dict_pair: name object;

// stream

stream: dict stream_main;
stream_main: K_STREAM STREAM_CONTENT_ENDSTREAM;

// indirect object
indirect_object_define: integer integer K_OBJ object K_ENDOBJ;

// indirect reference

indirct_reference: integer integer K_R;

// keyword: K_OBJ | K_ENDOBJ | K_STREAM | K_ENDSTREAM | K_XREF | K_TRAILER | K_STARTXREF | K_TRUE |
// K_FALSE | K_R | K_NULL;

// delimiter_char: LSTR_QUOTE_OPEN | RIGHT_PARENTHESIS | HSTR_QUOTE_OPEN | GREATER_THAN | ARRAY_OPEN
// | ARRAY_CLOSE | NAME_PREFIX | COMMENT_PREFIX | LEFT_CURLY_BRACKET | RIGHT_CURLY_BRACKET;

// whitespace: (WHITE_SPACE | eol_marker)+;

// eol_marker: (EOL_MARKER | comment)+;

any: .;

unexpected: any;
