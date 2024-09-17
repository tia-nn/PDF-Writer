import { ParserRuleContext } from 'antlr4';
import { Diagnostic } from 'vscode-languageserver';

export interface RuleIndex extends ParserRuleContext {
    get ruleIndex(): number;
}

export type ParseResult = {
    diagnostic: Diagnostic[];
}
