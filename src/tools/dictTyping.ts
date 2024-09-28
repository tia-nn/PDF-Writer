/*
 * PDF1.0 のオブジェクト定義
 */

export const DICT_TYPE = ['/Catalog', '/Pages', '/Page', '/Annot'] as const;
export type DictType = typeof DICT_TYPE[number] | 'unknown' | 'trailer' | '/Annot-/Text' | '/Annot-/Link';
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
    "/Catalog": CatalogDefinition,
    "/Pages": PagesDefinition,
    "/Page": PageDefinition,
    "/Annot": AnnotationSubtypesDefinition,
    "/Annot-/Text": TextAnnotationDefinition,
    "/Annot-/Link": LinkAnnotationDefinition,
};
