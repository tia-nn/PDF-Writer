lexer grammar PDFLexer;

@header {
    import { LexerATNSimulatorWithPos, TokenWithEndPos } from "../lib";
}

@lexer::members {
    emit(): Token {
        const t = super.emit() as TokenWithEndPos;
        t.endLine = (this._interp as LexerATNSimulatorWithPos).line;
        t.endColumn = (this._interp as LexerATNSimulatorWithPos).column;
        return t;
    }
}

/* --- HEADER part (DEFAULT_MODE) --- */

H_PDF: '%PDF-' [12][.][0-9] (EOL_MARKER | EOF);
H_COMMENT: '%' ~[\n\r]* (EOL_MARKER | EOF);

// コメント以外の入力はロールバックしてから BODY_MODE に入って rematch する
H_END:
	(. | EOF) {
        const i = this._input.index
        this._input.seek(i - 1);
        if (this._input.LA(1) === 0x0A) {
            this.line--;                         // 改行があった場合、行を1つ戻す
        } else {
            this.column--;                       // 改行がなければ列を1つ戻す
        }
    } -> mode(BODY_MODE);

/* --- BODY part --- */ mode BODY_MODE;

COMMENT: '%' ~[\n\r]+ (EOL_MARKER | EOF) -> skip;

// --- objects ---

// boolean
K_TRUE: 'true';
K_FALSE: 'false';

// null
K_NULL: 'null';

// numbers
REAL: [+\-]? (([0-9]+ '.' [0-9]*) | ('.' [0-9]+));
INTEGER: [+\-]? [0-9]+;

// strings
LSTR_OPEN: '(' -> pushMode(LSTRING_MODE);
HSTR_OPEN: '<' -> pushMode(HSTRING_MODE);

// names
NAME_PREFIX: '/' -> pushMode(NAME_MODE);

// arrays
ARR_OPEN: '[';
ARR_CLOSE: ']';

// dictionaries
DICT_OPEN: '<<';
DICT_CLOSE: '>>';

// streams
K_STREAM_: 'stream' -> pushMode(STREAM_MODE), more;

// objects
K_OBJ: 'obj';
K_ENDOBJ: 'endobj';
K_R: 'R';

// xref
K_XREF: 'xref' -> pushMode(XREF_MODE);
K_TRAILER: 'trailer';
K_STARTXREF: 'startxref' -> pushMode(TRAILER_MODE);
K_EOF: '%%EOF';

// parts

EOL_MARKER: ('\r\n' | '\r' | '\n') -> skip;
WHITE_SPACE: [\u0000\t\f ] -> skip;

INVALID_CHAR: ~[\u0000\t\f \r\n()<>[\]{}/%]+;

mode LSTRING_MODE;
LSTR_OPEN_IN: '(' -> pushMode(LSTRING_MODE), type(LSTR_OPEN);
LSTR_CLOSE: ')' -> popMode;
LSTR_ESC: '\\' ([nrtbf()\\] | ([0-7][0-7][0-7]) | '\n');
LSTR_INV_ESC: '\\';
LSTR_CONTENT: ~[\\()]+;

mode HSTRING_MODE;
HSTR_CLOSE: '>' -> popMode;
HSTR_CONTENT: [0-9a-fA-F]+;
HSTR_INV: ~[>0-9a-fA-F]+;

mode NAME_MODE;
NAME_CONTENT: ~[\u0000\t\f \r\n()<>[\]{}/%#]+;
// *NOTE: #エスケープは PDF 1.2 以降
NAME_ESC: '#' [0-9a-fA-F][0-9a-fA-F];
NAME_INV_ESC: '#' [0-9a-fA-F]?;
// 入力をロールバックしてから popMode して rematch する
NAME_END:
	(. | EOF) {
        const i = this._input.index
        this._input.seek(i - 1);
        if (this._input.LA(1) === 0x0A) {
            this.line--;                         // 改行があった場合、行を1つ戻す
        } else {
            this.column--;                       // 改行がなければ列を1つ戻す
        }
    } -> popMode;

mode STREAM_MODE;
// stream の詳細な文法は別で手書き処理する
STREAM: [\u0000\t\f \r\n] 'endstream' -> popMode;
STRM_CONTENT_: . -> more;

/* --- XREF part --- */

mode XREF_MODE;

K_TRAILER_: 'trailer' -> popMode, type(K_TRAILER);
K_STARTXREF_:
	'startxref' -> mode(TRAILER_MODE), type(K_STARTXREF);
K_EOF_: '%%EOF' -> popMode, type(K_EOF);
X_TYPE: 'n' | 'f';
X_INTEGER: [0-9]+;
X_EOL: '\r\n' | ' \n' | ' \r' | '\n' | '\r';
X_WS: ' ';

X_INVALID_CHAR: ~[nf0-9 \r\n]+;

mode TRAILER_MODE;

T_INTEGER: [0-9]+;
T_EOL: ('\r\n' | '\r' | '\n');
K_EOF__: '%%EOF' -> popMode, type(K_EOF);

T_INVALID_CHAR: ~[0-9\r\n]+;
