/*
 * PDF1.0 のオブジェクト定義
 */

export const DICT_TYPE = ['/Catalog', '/Pages', '/Page', '/Annot', '/Font', '/FontDescriptor'] as const;

export type DictType = typeof DICT_TYPE[number]
    | 'unknown' | 'trailer' | 'stream'
    | '/Annot-/Text' | '/Annot-/Link'
    | '/Font-/Type1' | '/Font-/MMType1' | '/Font-/Type3' | '/Font-/TrueType';
export type TypeFields = typeof DICT_TYPE[number];

export enum PDFObjectType {
    Dictionary = 1,
    Indirect = 2,
    Null = 4,
    Number = 8,
    String = 16,
    Name = 32,
    Array = 64,
    Stream = 128,
    Boolean = 256,
};

type PDFObjectDefinition = {
    [key: string]: {
        description: string,
        isRequired?: true,
        type: PDFObjectType,
        enum?: { [key: string]: string },
    } | undefined
}

// TODO: 説明の拡充

const TrailerDefinition: PDFObjectDefinition = {
    "/Size": {
        description: "この文書の Cross-Reference Table のエントリ数\nオリジナルとすべてのアップデートを含む",
        isRequired: true,
        type: PDFObjectType.Number,
    },
    "/Root": {
        description: "この文書の Catalog オブジェクト",
        isRequired: true,
        type: PDFObjectType.Indirect,
    },
    "/Prev": {
        description: "前の Cross-Reference Table のバイトオフセット\n最初の Cross-Reference Table の場合は指定しない",
        type: PDFObjectType.Number,
    },
    "/Info": {
        description: "この文書の情報",
        type: PDFObjectType.Indirect,
    },
}

const StreamDefinition: PDFObjectDefinition = {
    "/Length": {
        description: "ストリームのバイト数",
        isRequired: true,
        type: PDFObjectType.Number,
    },
    "/Filter": {
        description: "ストリームの圧縮方法",
        type: PDFObjectType.Array,
        enum: {
            "/ASCIIHexDecode": "ASCII-hex 圧縮",
            "/ASCII85Decode": "base85 圧縮",
            "/LZWDecode": "LZW 圧縮",
            "/RunLengthDecode": "ランレングス圧縮",
            "/CCITTFaxDecode": "CCITT Group 3 または Group 4 圧縮",
            "/DCTDecode": "JPEG 圧縮",
        }
    },
    "/DecodeParms": {
        description: "圧縮方法のパラメータ",
        type: PDFObjectType.Array,
    },
}

const CatalogDefinition: PDFObjectDefinition = {
    "/Type": {
        description: "この辞書の種類",
        isRequired: true,
        type: PDFObjectType.Name,
        enum: { "/Catalog": "このPDFドキュメントのルートノード" },
    },
    "/Pages": {
        description: "Pages Tree のルート Pages オブジェクト",
        isRequired: true,
        type: PDFObjectType.Indirect,
    },
    "/Outlines": {
        description: "Outlines Tree のルート Outlines オブジェクト\n\n/PageMode が /UseOutlines である場合必須",
        type: PDFObjectType.Indirect,
    },
    "/PageMode": {
        description: "ドキュメントを開いたときにどう表示されるか\n\ndefault: /UseNone",
        type: PDFObjectType.Name,
        enum: {
            "/UseNone": "アウトラインもサムネイルも表示せずにドキュメントを開く",
            "/UseOutlines": "アウトラインを表示してドキュメントを開く",
            "/UseThumbs": "サムネイルを表示してドキュメントを開く"
        }
    },
}

const PagesDefinition: PDFObjectDefinition = {
    "/Type": {
        description: "この辞書の種類",
        isRequired: true,
        type: PDFObjectType.Name,
        enum: { "/Pages": "Pages Tree のルートノード" }
    },
    "/Kids": {
        description: "子ノードの関節参照リスト",
        isRequired: true,
        type: PDFObjectType.Array
    },
    "/Count": {
        description: "このノード下にあるページの数",
        isRequired: true,
        type: PDFObjectType.Number
    },
    "/Parent": {
        description: "このノードの親ノード\n\nルートノードの場合は指定しない",
        type: PDFObjectType.Indirect
    },
}

const PageDefinition: PDFObjectDefinition = {
    "/Type": {
        description: "この辞書の種類",
        isRequired: true,
        type: PDFObjectType.Name,
        enum: { "/Page": "ページノード" }
    },
    "/MediaBox": {
        description: "ページサイズ",
        isRequired: true,
        type: PDFObjectType.Array
    },
    "/Parent": {
        description: "親ノード",
        isRequired: true,
        type: PDFObjectType.Indirect
    },
    "/Resources": {
        description: "このページで使用されるリソース",
        type: PDFObjectType.Indirect
    },
    "/Contents": {
        description: "このページのコンテンツ",
        type: PDFObjectType.Indirect | PDFObjectType.Array
    },
    "/CropBox": {
        description: "クロップボックス",
        type: PDFObjectType.Array
    },
    "/Rotate": {
        description: "回転の角度\n\n90の倍数である必要がある",
        type: PDFObjectType.Number
    },
    "/Thumb": {
        description: "サムネイル",
        type: PDFObjectType.Stream
    },
    "/Annots": {
        description: "アノテーション",
        type: PDFObjectType.Array
    },
}

const ResourcesDefinition: PDFObjectDefinition = {
    "/ProcSet": {
        description: "このリソースで使用されるプロシージャセット",
        isRequired: true,
        type: PDFObjectType.Array
    },
    "/Font": {
        description: "このリソースで使用されるフォント",
        type: PDFObjectType.Dictionary
    },
    "/XObject": {
        description: "このリソースで使用される外部オブジェクト",
        type: PDFObjectType.Dictionary
    },
}

const TextAnnotationDefinition: PDFObjectDefinition = {
    "/Type": {
        description: "この辞書の種類",
        isRequired: true,
        type: PDFObjectType.Name,
        enum: { "/Annot": "アノテーション" }
    },
    "/Subtype": {
        description: "アノテーションの種類",
        isRequired: true,
        type: PDFObjectType.Name,
        enum: {
            "/Text": "テキスト",
        }
    },
    "/Rect": {
        description: "アノテーションの位置",
        isRequired: true,
        type: PDFObjectType.Array
    },
    "/Contents": {
        description: "アノテーションの内容",
        type: PDFObjectType.String
    },
    "/Open": {
        description: "リンクの目的地を開くかどうか",
        type: PDFObjectType.Boolean
    },
}

const LinkAnnotationDefinition: PDFObjectDefinition = {
    "/Type": {
        description: "この辞書の種類",
        isRequired: true,
        type: PDFObjectType.Name,
        enum: { "/Annot": "アノテーション" }
    },
    "/Subtype": {
        description: "アノテーションの種類",
        isRequired: true,
        type: PDFObjectType.Name,
        enum: {
            "/Link": "リンク",
        }
    },
    "/Rect": {
        description: "アノテーションの位置",
        isRequired: true,
        type: PDFObjectType.Array
    },
    "/Dest": {
        description: "リンクの目的地",
        type: PDFObjectType.String
    },
    "/Border": {
        description: "リンクの枠線",
        type: PDFObjectType.Array
    },
}

const AnnotationSubtypesDefinition: PDFObjectDefinition = {
    "/Type": {
        description: "この辞書の種類",
        isRequired: true,
        type: PDFObjectType.Name,
        enum: { "/Annot": "アノテーション" }
    },
    "/Subtype": {
        description: "アノテーションの種類",
        isRequired: true,
        type: PDFObjectType.Name,
        enum: {
            "/Text": "テキスト",
            "/Link": "リンク",
        }
    },
}

const FontSubtypeDefinition: PDFObjectDefinition = {
    "/Type": {
        description: "この辞書の種類",
        isRequired: true,
        type: PDFObjectType.Name,
        enum: { "/Font": "フォント" }
    },
    "/Subtype": {
        description: "フォントの種類",
        isRequired: true,
        type: PDFObjectType.Name,
        enum: {
            "/Type1": "Type1 フォント",
            "/MMType1": "Multiple Master Type1 フォント",
            "/Type3": "Type3 フォント",
            "/TrueType": "TrueType フォント",
        }
    },
    "/Name": {
        description: "フォント名",
        isRequired: true,
        type: PDFObjectType.String,
    },
    "/FirstChar": {
        description: "width リストの最初の文字コード",
        // isRequired: true, // 一部のフォントで省略される
        type: PDFObjectType.Number,
    },
    "/LastChar": {
        description: "width リストの最後の文字コード",
        // isRequired: true, // 一部のフォントで省略される
        type: PDFObjectType.Number,
    },
    "/Widths": {
        description: "文字幅のリスト",
        // isRequired: true, // 一部のフォントで省略される
        type: PDFObjectType.Array,
    },
    "/Encoding": {
        description: "フォントの文字コードエンコーディング",
        type: PDFObjectType.Name,
        enum: {
            "/WinAnsiEncoding": "Windows-1252",
            "/MacRomanEncoding": "MacRoman",
            "/MacExpertEncoding": "MacExpert",
            "/PDFDocEncoding": "PDFDoc",
            "/BasicEncoding": "Basic",
        }
    },
}

const Type1FontDefinition: PDFObjectDefinition = {
    ...FontSubtypeDefinition,
    "/BaseFont": {
        description: "ベースフォント名",
        isRequired: true,
        type: PDFObjectType.Name,
        enum: {
            "/Courier": "Courier",
            "/Courier-Bold": "Courier-Bold",
            "/Courier-Oblique": "Courier-Oblique",
            "/Courier-BoldOblique": "Courier-BoldOblique",
            "/Helvetica": "Helvetica",
            "/Helvetica-Bold": "Helvetica-Bold",
            "/Helvetica-Oblique": "Helvetica-Oblique",
            "/Helvetica-BoldOblique": "Helvetica-BoldOblique",
            "/Times-Roman": "Times-Roman",
            "/Times-Bold": "Times-Bold",
            "/Times-Italic": "Times-Italic",
            "/Times-BoldItalic": "Times-BoldItalic",
            "/Symbol": "Symbol",
            "/ZapfDingbats": "ZapfDingbats",
        }
    },
    "/FontDescriptor": {
        description: "フォント記述子",
        type: PDFObjectType.Indirect,
    }
}

const MMType1FontDefinition: PDFObjectDefinition = {
    ...FontSubtypeDefinition,
    "/BaseFont": {
        description: "ベースフォント名\n\nスペースが含まれる場合は _ で置換したもの",
        isRequired: true,
        type: PDFObjectType.Name,
    },
    "/FontDescriptor": {
        description: "フォント記述子",
        type: PDFObjectType.Indirect,
    },
}

const Type3FontDefinition: PDFObjectDefinition = {
    ...FontSubtypeDefinition,
    "/CharProcs": {
        description: "文字の描画手続き",
        type: PDFObjectType.Dictionary,
    },
    "/FontBBox": {
        description: "フォントの外接矩形",
        type: PDFObjectType.Array,
    },
    "/FontMatrix": {
        description: "フォント行列",
        type: PDFObjectType.Array,
    },
}

const TrueTypeFontDefinition: PDFObjectDefinition = {
    ...FontSubtypeDefinition,
    "/BaseFont": {
        description: "ベースフォント名",
        isRequired: true,
        type: PDFObjectType.Name,
    },
    "/FontDescriptor": {
        description: "フォント記述子",
        type: PDFObjectType.Indirect,
    },
}

const FontDescriptorDefinition: PDFObjectDefinition = {
    "/Type": {
        description: "この辞書の種類",
        isRequired: true,
        type: PDFObjectType.Name,
        enum: { "/FontDescriptor": "フォント記述子" }
    },
    "/Ascent": {
        description: "このフォントの文字がベースラインから到達する最大の高さ",
        isRequired: true,
        type: PDFObjectType.Number,
    },
    "/CapHeight": {
        description: "",
        isRequired: true,
        type: PDFObjectType.Number,
    },
    "/Descent": {
        description: "このフォントの文字がベースラインから到達する最大の深さ\n\n負の値になる",
        isRequired: true,
        type: PDFObjectType.Number,
    },
    "/Flags": {
        description: "",
        isRequired: true,
        type: PDFObjectType.Number,
    },
    "/FontBBox": {
        description: "",
        isRequired: true,
        type: PDFObjectType.Array,
    },
    "/FontName": {
        description: "",
        isRequired: true,
        type: PDFObjectType.Name,
    },
    "/ItalicAngle": {
        description: "",
        isRequired: true,
        type: PDFObjectType.Number,
    },
    "/StemV": {
        description: "",
        isRequired: true,
        type: PDFObjectType.Number,
    },
    "/AvgWidth": {
        description: "",
        type: PDFObjectType.Number,
    },
    "/FontFile": {
        description: "",
        type: PDFObjectType.Stream,
    },
    "/Leading": {
        description: "",
        type: PDFObjectType.Number,
    },
    "/MaxWidth": {
        description: "",
        type: PDFObjectType.Number,
    },
    "/MissingWidth": {
        description: "",
        type: PDFObjectType.Number,
    },
    "/StemH": {
        description: "",
        type: PDFObjectType.Number,
    },
    "/XHeight": {
        description: "",
        type: PDFObjectType.Number,
    },
}

const UnknownDefinition: PDFObjectDefinition = {
    "/Type": {
        description: "この辞書の種類",
        isRequired: true,
        type: PDFObjectType.Name,
        // TODO: 翻訳・充実
        enum: {
            "/Catalog": CatalogDefinition["/Type"]!.enum!["/Catalog"],
            "/Pages": PagesDefinition["/Type"]!.enum!["/Pages"],
            "/Page": "ページ",
            "/Font": "フォント",
            "/Annot": TextAnnotationDefinition["/Type"]!.enum!["/Annot"],
        }
    }
}

export const DictDefinitions: { [key in DictType]: PDFObjectDefinition } = {
    "unknown": UnknownDefinition,
    "trailer": TrailerDefinition,
    "stream": StreamDefinition,
    "/Catalog": CatalogDefinition,
    "/Pages": PagesDefinition,
    "/Page": PageDefinition,
    "/Annot": AnnotationSubtypesDefinition,
    "/Annot-/Text": TextAnnotationDefinition,
    "/Annot-/Link": LinkAnnotationDefinition,
    "/Font": FontSubtypeDefinition,
    "/Font-/Type1": Type1FontDefinition,
    "/Font-/MMType1": MMType1FontDefinition,
    "/Font-/Type3": Type3FontDefinition,
    "/Font-/TrueType": TrueTypeFontDefinition,
    "/FontDescriptor": FontDescriptorDefinition,
};
