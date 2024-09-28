export const DICT_TYPE = ['/Catalog'] as const;
export type DictType = typeof DICT_TYPE[number] | 'unknown' | 'trailer';
export type TypeFields = typeof DICT_TYPE[number];

type PDFObjectType = "Dictionary" | "Array" | "Name" | "String" | "Number" | "Boolean" | "Null" | "Stream" | "IndirectObjectReference";
type PDFObjectDefinition = {
    [key: string]: {
        description: string,
        isRequired?: true,
        beIndirect?: true,
        type: PDFObjectType,
        enum?: { [key: string]: string },
    } | undefined
}

const UnknownDefinition: PDFObjectDefinition = {
    "/Type": {
        description: "この辞書の種類",
        isRequired: true,
        type: "Name",
        // TODO: 翻訳・充実
        enum: {
            "/Catalog": "The Catalog is a dictionary that is the root node of the document. It contains a reference to the tree of pages contained in the document, and a reference to the tree of objects representing the document’s outline. In addition, the Catalog indicates whether the document’s outline or thumbnail page images should be displayed automatically when the document is viewed.",
            "/Pages": "ページツリーのルート",
            "/Page": "ページ",
            "/Font": "フォント"
        }
    }
}

const TrailerDefinition: PDFObjectDefinition = {
    "/Size": {
        description: "この文書の Cross-Reference Table のエントリ数\nオリジナルとすべてのアップデートを含む",
        isRequired: true,
        type: "Number"
    },
    "/Root": {
        description: "この文書の Catalog オブジェクト",
        isRequired: true,
        beIndirect: true,
        type: "Dictionary"
    },
    "/Prev": {
        description: "前の Cross-Reference Table のバイトオフセット\n最初の Cross-Reference Table の場合は指定しない",
        type: "Number"
    },
    "/Info": {
        description: "この文書の情報",
        beIndirect: true,
        type: "Dictionary"
    },
}

const CatalogDefinition: PDFObjectDefinition = {
    "/Type": {
        description: "この辞書の種類",
        isRequired: true,
        type: "Name",
        enum: { "/Catalog": UnknownDefinition["/Type"]?.enum?.["/Catalog"] || "" }
    },
    "/Pages": {
        description: "この文書の Pages Tree のルート Pages オブジェクト",
        isRequired: true,
        beIndirect: true,
        type: "Dictionary"
    },
    "/Outlines": {
        description: "この文書の Outlines Tree のルート Outlines オブジェクト\n/PageMode が /UseOutlines である場合必須",
        beIndirect: true,
        type: "Dictionary"
    },
    "/PageMode": {
        description: "ドキュメントを開いたときにどう表示されるか\ndefault: /UseNone",
        type: "Name",
        // TODO: 翻訳
        enum: {
            "/UseNone": "Open document with neither outline nor thumbnails visible",
            "/UseOutlines": "Open document with outline visible",
            "/UseThumbs": "Open document with thumbnails visible"
        }
    },
}


export const DictDefinitions: { [key in DictType]: PDFObjectDefinition } = {
    "unknown": UnknownDefinition,
    "trailer": TrailerDefinition,
    "/Catalog": CatalogDefinition,
};
