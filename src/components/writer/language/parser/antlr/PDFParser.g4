parser grammar PDFParser;
options {
	tokenVocab = PDFLexer;
}

// TODO: incremental update に対応
start: H_PDF body xrefSection trailer;

body: indirectObjectDefine*;

// comment: COMMENT_PREFIX COMMENT_CONTENT?;

object:
	indirectReference
	| stream
	| dict
	| array
	| name
	| number
	| string
	| nullObj;

// number

number: integer | real;
integer: INTEGER;
real: FLOAT;
name: NAME_PREFIX nameContent*;
nameContent: NAME_ESCAPE | NAME_ESC_INVALID | NAME_CONTENT;

// string
string: literalString | hexString;
literalString:
	LSTR_QUOTE_OPEN literalStringContent* LSTR_QUOTE_CLOSE;
literalStringContent:
	escapeSequence
	| literalStringInner
	| INVALID_ESCAPE
	| LSTR_CONTENT;
literalStringInner:
	LSTR_QUOTE_OPEN_INNER literalStringContent* LSTR_QUOTE_CLOSE;
escapeSequence: ESCAPE_CHAR | ESCAPE_OCTAL | ESCAPE_NEWLINE;

hexString: HSTR_QUOTE_OPEN hexStringContent* HSTR_QUOTE_CLOSE;
hexStringContent: HSTR_CONTENT | HSTR_INVALID;

// null

nullObj: K_NULL;

// array

array: ARRAY_OPEN object* ARRAY_CLOSE;

// dict

dict: DICT_OPEN dictPair* DICT_CLOSE;
dictPair: (name object?) | object;

// stream

stream: dict? streamMain;
streamMain: K_STREAM STREAM_CONTENT_ENDSTREAM;

// indirect object
indirectObjectDefine: integer? integer? K_OBJ object? K_ENDOBJ;

// indirect reference
indirectReference: integer? integer? K_R;

// xref

// 固定フォーマットの検証は AST 作成のタイミングで対応する

xrefSection: K_XREF xrefSubsection*;

xrefSubsection: xrefEntry+ | xrefSubsectionHeader xrefEntry*;
xrefSubsectionHeader: integer integer;
xrefEntry: integer integer xrefType;
xrefType: XREF_TYPE_N | XREF_TYPE_F;

// trailer

trailer: K_TRAILER dict? K_STARTXREF? integer? H_EOF?;
