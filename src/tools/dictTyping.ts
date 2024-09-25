export const DICT_TYPE = ['unknown', 'trailer', '/Catalog'] as const;
export type DictType = typeof DICT_TYPE[number];

type PDFObjectType = "Dictionary" | "Array" | "Name" | "String" | "Number" | "Boolean" | "Null" | "Stream" | "IndirectObjectReference";
type PDFObjectDefinition = {
    [key: string]: {
        description: string,
        isRequired?: true,
        beIndirect?: true,
        type: PDFObjectType,
        enum?: string[],
    } | undefined
}

const UnknownDefinition: PDFObjectDefinition = {
    "/Type": {
        description: "この辞書の種類",
        isRequired: true,
        type: "Name",
        enum: ["/Catalog", "/Pages", "/Page", "/Font"]
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
        type: "Name"
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
        enum: ["/UseNone", "/UseOutlines", "/UseThumbs"]
    },
}


export const DictDefinitions: { [key in DictType]: PDFObjectDefinition } = {
    "unknown": UnknownDefinition,
    "trailer": TrailerDefinition,
    "/Catalog": CatalogDefinition,
};
