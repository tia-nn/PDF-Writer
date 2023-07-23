parser grammar LexerDebug;
options {
	tokenVocab = PDFLexer;
}

start: any*;

any: .;
