import { CharStream, LexerATNSimulator, PredictionContextCache } from "antlr4";
import PDFLexer from "./dist/PDFLexer";

export class PDFLexerEx extends PDFLexer {
    _interp: LexerATNSimulatorEx;

    constructor(input: CharStream) {
        super(input);
        this._interp = new LexerATNSimulatorEx(this, PDFLexer._ATN, PDFLexer.DecisionsToDFA, new PredictionContextCache());
    }

    lastEmptyTokenAction(): void {
        this._input.seek(this._input.index - 1);
        this.line = this._interp.lastLine;
        this.column = this._interp.lastColumn;
    }
}

/**
 * LexerATNSimulator が内部的に持つ line と column へアクセスする
 * https://github.com/antlr/antlr4/blob/cc82115a4e7f53d71d9d905caa2c2dfa4da58899/runtime/JavaScript/src/antlr4/atn/LexerATNSimulator.js#L65-L71
 */
interface LexerATNSimulatorWithPos extends LexerATNSimulator {
    line: number;
    column: number;
}

/**
 * Consume 時点の line と column を記録する LexerATNSimulator
 * https://github.com/antlr/antlr4/blob/cc82115a4e7f53d71d9d905caa2c2dfa4da58899/runtime/JavaScript/src/antlr4/atn/LexerATNSimulator.js#L619-L628
 */
class LexerATNSimulatorEx extends LexerATNSimulator {
    lastColumn: number = 0;
    lastLine: number = 0;
    consume(input: CharStream): void {
        this.lastColumn = (this as any as LexerATNSimulatorWithPos).column;
        this.lastLine = (this as any as LexerATNSimulatorWithPos).line;
        super.consume(input);
    }
}
