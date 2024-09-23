import { LexerATNSimulator, Token } from "antlr4";

/**
 * Token に endLine と endColumn を追加する
*/
export interface TokenWithEndPos extends Token {
    endLine: number;
    endColumn: number;
}

/**
 * LexerATNSimulator が内部的に持つ line と column へアクセスする
 * https://github.com/antlr/antlr4/blob/cc82115a4e7f53d71d9d905caa2c2dfa4da58899/runtime/JavaScript/src/antlr4/atn/LexerATNSimulator.js#L65-L71
 */
export interface LexerATNSimulatorWithPos extends LexerATNSimulator {
    line: number;
    column: number;
}
