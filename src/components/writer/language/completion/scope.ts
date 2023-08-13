import { ArrayNode } from "../parser/ast/ast/array";
import { DictNode } from "../parser/ast/ast/dict";
import { BodyNode } from "../parser/ast/ast/doby";
import { NameNode } from "../parser/ast/ast/name";
import { StartNode } from "../parser/ast/ast/start";
import { TrailerNode } from "../parser/ast/ast/trailer";

// export type Scope = ScopeKindBody | ScopeKindDict | ScopeKindOthers;
export type Scope = ScopeKindDict | ScopeKindOutside;

export type ScopeKindDict = {
    kind: "dict";
    node: DictNode;
    state: { kind: "key", } | { kind: "value", key: NameNode, };
    inTrailer?: boolean;
};

// export type ScopeKindBody = {
//     kind: "body",
//     node: BodyNode,
// };

export type ScopeKindOutside = {
    kind: "outside";
};
