/** @type {import("monaco-editor/esm/vs/editor/editor.api").languages.IMonarchLanguage} */
const MonarchLanguagePDF = {
    keywords: [
        'obj', 'endobj', 'stream', 'endstream', 'xref', 'trailer', 'startxref', 'true', 'false', 'R',
    ],

    operators_2: [
        '<<', '>>',
    ],
    operators_1: [
        '<', '>', '(', ')', '[', ']',
    ],

    regular_char: /[^\r\n\000\t\f \(\)<>\[\]{}\/%]/,
    delimiter_char: /[\(\)<>\[\]{}\/%]/,

    whitespace_char: /[\000\t\f ]/,
    // Monaco editor doesn't evaluate a multiline regex. So, eol_marker doesn't work.
    // eol_marker: /(?:\r\n|\n|\r)/,
    // except_eol_marker: /[^\n\r]/,
    // The main tokenizer for our languages
    tokenizer: {
        root: [
            [/%.*/, { cases: { '@eos': 'comment' } }],
            [/[+\-0-9]\d*[.]\d*/, 'number.float'],
            [/[+\-]?\d+/, 'number'],
            [/\/@regular_char*/, 'variable.name'],
            [/@delimiter_char{2}/, {
                cases: { '@operators_2': 'operator' },
            }],
            [/\(/, { token: 'string.quote', bracket: '@open', next: '@literal_string' }],
            [/</, { token: 'string.quote', bracket: '@open', next: '@hexadecimal_string' }],
            [/@delimiter_char{1}/, {
                cases: {
                    '@operators_1': 'operator',
                }
            }],
            [/@regular_char+/, {
                cases: {
                    '@keywords': 'keyword',
                },
            }],
        ],

        literal_string: [
            [/\\([nrtbf()\\]|[0-7]{1,3})/, 'string.escape'],
            [/\\/, { cases: { '@eos': 'string.escape', '': 'invalid' } }],
            [/[^\\\(\)]/, 'string'],
            [/\\n/, 'comment'], [/\(/, 'string', '@inner_literal_string'],
            [/\)/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
        ],

        inner_literal_string: [
            [/\\([nrtbf()\\]|[0-7]{1,3})/, 'string.escape'],
            [/\\/, { cases: { '@eos': 'string.escape', '': 'invalid' } }],
            [/[^\\\(\)]/, 'string'],
            [/\(/, 'string', '@push'],
            [/\)/, 'string', '@pop'],
        ],

        hexadecimal_string: [
            [/[0-9a-fA-F]/, 'string'],
            [/@whitespace_char+/, ''],
            [/>/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
            [/./, 'invalid'],
        ],

        stream_object: [
            [/endstream/, 'keyword', '@pop'],
            [/./, ''],
        ],

    },
};
export default MonarchLanguagePDF;
