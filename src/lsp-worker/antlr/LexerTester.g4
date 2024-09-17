parser grammar LexerTester;
options {
	tokenVocab = PDFLexer;
}

start: any*;

any: .;
