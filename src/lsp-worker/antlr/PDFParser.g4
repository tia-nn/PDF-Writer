parser grammar PDFParser;
options {
	tokenVocab = PDFLexer;
}

// TODO: incremental update に対応
start: header body xref? trailer? startxref? EOF?;

header: H_PDF? header_comment* H_END;
header_comment: H_COMMENT | H_PDF;

body: object*;

// --- objects ---
object:
	indirect_obj
	| indirect_ref
	| null
	| boolean
	| number
	| string
	| name
	| array
	| stream
	| dictionary
	| invalid_code;

// null
null: K_NULL;

// boolean
boolean: K_TRUE | K_FALSE;

// numbers
number: integer | real;
integer: INTEGER;
real: REAL;

// strings
string: lstring | hstring;
lstring: LSTR_OPEN lstring_content* LSTR_CLOSE?;
lstring_content:
	LSTR_CONTENT
	| LSTR_ESC
	| LSTR_INV_ESC
	| lstring;
hstring: HSTR_OPEN (HSTR_CONTENT | HSTR_INV)* HSTR_CLOSE?;

// names
name: NAME_PREFIX NAME_CONTENT* NAME_END;
name_content: NAME_CONTENT | NAME_ESC | NAME_INV_ESC;

// arrays
array: ARR_OPEN object* ARR_CLOSE?;

// dictionaries
dictionary: DICT_OPEN dictionary_entry* DICT_CLOSE?;
dictionary_entry: name? object;

// streams
stream: dictionary? STREAM;

// objects
indirect_obj: obj_id object* stream? K_ENDOBJ?;
obj_id: integer? integer? K_OBJ;
indirect_ref: integer? integer? K_R;

invalid_code: INVALID_CHAR;

// xref
xref: K_XREF X_EOL? (xref_entry | xref_header)*;
xref_header: X_INTEGER X_WS* X_INTEGER? xref_invalid* X_EOL?;
xref_entry:
	X_INTEGER? X_WS* X_INTEGER? X_WS* X_TYPE xref_invalid* X_EOL?
	| X_INTEGER X_WS* X_INTEGER? X_WS* X_TYPE? xref_invalid* X_EOL?;
xref_invalid: X_INTEGER | X_TYPE | X_WS | X_INVALID_CHAR;

// trailer
trailer: K_TRAILER dictionary?;

// startxref
startxref:
	K_STARTXREF T_EOL? T_INVALID_CHAR* T_EOL? T_INTEGER startxref_invalid? T_EOL? K_EOF?;
startxref_invalid: T_INTEGER | T_INVALID_CHAR;
