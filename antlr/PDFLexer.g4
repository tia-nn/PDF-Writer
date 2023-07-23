lexer grammar PDFLexer;

// TODO: 先頭のヘッダとバイナリのコメントをパースする

// TODO: dict, array 等の中にコメントがある時に無視する

H_PDF: '%PDF-' [12][.][0-9] -> pushMode(COMMENT_MODE);
H_EOF: '%%EOF';

FLOAT: [+\-0-9][0-9]* '.' [0-9]*; // number
INTEGER: [+\-]? [0-9]+;

// delimiter
NAME_PREFIX: '/' -> pushMode(NAME_MODE);
DICT_OPEN: '<<';
DICT_CLOSE: '>>';
ARRAY_OPEN: '[';
ARRAY_CLOSE: ']';
LSTR_QUOTE_OPEN: '(' -> pushMode(LSTRING_MODE);
RIGHT_PARENTHESIS: ')';
HSTR_QUOTE_OPEN: '<' -> pushMode(HSTRING_MODE);
GREATER_THAN: '>';
COMMENT_PREFIX: '%' -> skip, pushMode(COMMENT_MODE);
LEFT_CURLY_BRACKET: '{';
RIGHT_CURLY_BRACKET: '}';

// keywords
K_OBJ: 'obj';
K_ENDOBJ: 'endobj';
K_STREAM: 'stream' -> pushMode(STREAM_MODE);
K_ENDSTREAM: 'endstream';
K_XREF: 'xref' -> pushMode(XREF_MODE);
K_TRAILER: 'trailer';
K_STARTXREF: 'startxref';
K_TRUE: 'true';
K_FALSE: 'false';
K_R: 'R';
K_NULL: 'null';

// others
REGULAR_CHAR: ~[\u0000\t\f \r\n()<>[\]{}/%];
EOL_MARKER: ('\r\n' | '\r' | '\n') -> skip;
WHITE_SPACE: [\u0000\t\f ] -> skip;
EXCEPT_EOL_CHAR: ~[\n\r];

mode COMMENT_MODE;
COMMENT_CONTENT: ~[\n\r]+ -> skip;
COMMENT_END: ('\r\n' | '\r' | '\n') -> skip, popMode;

mode LSTRING_MODE;
LSTR_QUOTE_OPEN_INNER:
	LSTR_QUOTE_OPEN -> pushMode(LSTRING_MODE);
LSTR_QUOTE_CLOSE: RIGHT_PARENTHESIS -> popMode;
ESCAPE_CHAR: BACKSLASH [nrtbf()\\];
ESCAPE_OCTAL:
	BACKSLASH (OCTAL OCTAL OCTAL | OCTAL OCTAL | OCTAL);
ESCAPE_NEWLINE: BACKSLASH EOL_MARKER;
INVALID_ESCAPE: BACKSLASH;
LSTR_CONTENT: ~[\\()]+;
BACKSLASH: '\\';
OCTAL: [0-7];

mode HSTRING_MODE;
HSTR_QUOTE_CLOSE: GREATER_THAN -> popMode;
HSTR_CONTENT: [0-9a-fA-F]+;
HSTR_INVALID: ~[>0-9a-fA-F]+;

mode NAME_MODE;
NAME_CONTENT: ~[\u0000\t\f \r\n()<>[\]{}/%#]+;
NAME_ESCAPE: NUMBER_SIGN [0-9a-fA-F][0-9a-fA-F];
NAME_ESC_INVALID: NUMBER_SIGN [0-9a-fA-F]?;
NUMBER_SIGN: '#';

// TODO: トークンを消費しないでモードを切り替えだけしたい。ひとまずデリミタが有限個だけなのでそれぞれ動作を書いている。
N_NAME_PREFIX:
	NAME_PREFIX -> type(NAME_PREFIX), mode(NAME_MODE);
N_DICT_OPEN: DICT_OPEN -> type(DICT_OPEN), popMode;
N_DICT_CLOSE: DICT_CLOSE -> type(DICT_CLOSE), popMode;
N_ARRAY_OPEN: ARRAY_OPEN -> type(ARRAY_OPEN), popMode;
N_ARRAY_CLOSE: ARRAY_CLOSE -> type(ARRAY_CLOSE), popMode;
N_LSTR_QUOTE_OPEN:
	LSTR_QUOTE_OPEN -> type(LSTR_QUOTE_OPEN), mode(LSTRING_MODE);
N_RIGHT_PARENTHESIS:
	RIGHT_PARENTHESIS -> type(RIGHT_PARENTHESIS), popMode;
N_HSTR_QUOTE_OPEN:
	HSTR_QUOTE_OPEN -> type(HSTR_QUOTE_OPEN), mode(HSTRING_MODE);
N_GREATER_THAN: GREATER_THAN -> type(GREATER_THAN), popMode;
N_COMMENT_PREFIX:
	COMMENT_PREFIX -> type(COMMENT_PREFIX), mode(COMMENT_MODE);
N_LEFT_CURLY_BRACKET:
	LEFT_CURLY_BRACKET -> type(LEFT_CURLY_BRACKET), popMode;
N_RIGHT_CURLY_BRACKET:
	RIGHT_CURLY_BRACKET -> type(RIGHT_CURLY_BRACKET), popMode;

N_WHITESPACE: [\u0000\t\f \r\n] -> skip, popMode;

// unreachable
NAME_INVALID: .;

// TODO: endstream を別にトークナイズしたい。現状は content が細切れになるか末尾に endstream がくっつくかで後者をとっている。
mode STREAM_MODE;
STREAM_CONTENT_ENDSTREAM: K_ENDSTREAM -> popMode;
STREAM_CONTENT: . -> more;

mode XREF_MODE;

XREF_n: [0-9]{10};
XREF_g: [0-9]{5};
XREF_TYPE_N: 'n';
XREF_TYPE_F: 'f';

XREF_INT: INTEGER;
XREF_SP: ' ';

XREF_EOL_CRLF: '\r\n';
XREF_EOL_SPCR_SPLF: ' \r' | ' \n';
XREF_EOL_CL_LF: '\n' | '\r';

// TODO: トークンを消費しないでモード切り替えだけしたい。ひとまず trailer と white-space のみそれぞれの動作を書く。
XREF_WHITESPACE: [\u0000\t\f \r\n] -> skip, popMode;
XREF_TRAILER:
	K_TRAILER -> type(K_TRAILER), mode(DEFAULT_MODE);

XREF_INVALID
