import { LexerATNSimulator, Token } from "antlr4";

/**
 * Token に endLine と endColumn を追加する
*/
export interface TokenWithEndPos extends Token {
    endLine: number;
    endColumn: number;
}
