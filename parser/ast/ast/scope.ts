import { ArrayNode } from "./array";
import { DictNode } from "./dict";
import { BodyNode } from "./doby";
import { NameNode } from "./name";
import { StartNode } from "./start";
import { TrailerNode } from "./trailer";

// export type Scope = ScopeKindBody | ScopeKindDict | ScopeKindOthers;
export type Scope = ScopeKindTrailerDict | ScopeKindOthers;

export type ScopeKindTrailerDict = {
    kind: "trailerdict",
    node: DictNode,
    state: { kind: "key", } | { kind: "value", key: NameNode, };
};

// export type ScopeKindDict = {
//     kind: "dict",
//     node: DictNode,
// };

// export type ScopeKindBody = {
//     kind: "body",
//     node: BodyNode,
// };

export type ScopeKindOthers = {
    kind: "others",
    node: StartNode,
};
