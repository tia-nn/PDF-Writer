import { TerminalNode, Token } from "antlr4";
import { ASTVisitor } from "../parser/ast/ASTVisitor";
import { Position } from "../parser/ast/ast/position";
import { StartNode } from "../parser/ast/ast/start";
import { Scope, ScopeKindOutside } from "./scope";
import { TrailerNode } from "../parser/ast/ast/trailer";
import { DictNode } from "../parser/ast/ast/dict";


export class ScopeDetector extends ASTVisitor<Scope> {
    detect(node: StartNode, cPos: number) {
        return this.visitStart(node, cPos);
    }

    visitStart(node: StartNode, cPos: number): Scope {
        // TODO: 条件に合わせて複数 scope を返す (か複数状態のscopeを定義して返す)
        if (!node.v.body && !node.v.header && !node.v.trailer && !node.v.xref) {
            console.log('in header (clear).', cPos);
        }

        if (node.v.header && inRange(termPos(node.v.header.src), cPos)) {
            console.log('in header.', cPos);
        }
        if (node.v.body && inRange(node.v.body.src.position, cPos)) {
            console.log('in body.', cPos);
        }
        if (node.v.xref && inRange(node.v.xref.src.position, cPos)) {
            console.log('in xref.', cPos);
        }
        if (node.v.trailer && inRange(node.v.trailer.src.position, cPos)) {
            return this.visitTrailer(node.v.trailer.src, cPos);
        }

        return { kind: "outside" };
    }

    visitTrailer(node: TrailerNode, cPos: number): Scope {
        if (node.v.dict && inRange(node.v.dict.src.position, cPos)) {
            return this.visitDict(node.v.dict.src, cPos, true);
        }

        return { kind: "outside" };
    }

    visitDict(node: DictNode, cPos: number, inTrailer?: boolean): Scope {
        if (!node.v.dictClose || node.v.dictClose.value == "missing") return { kind: "outside" };

        // << >> 付近
        if (node.v.contents.src.length === 0) {
            if (betweenPosition(termPos(node.v.dictOpen.src), termPos(node.v.dictClose.src), cPos)) {  // 内容が空で << と >> の間
                return { kind: "dict", node: node, state: { kind: "key" }, inTrailer };
            } else return { kind: "outside" };
        } else {
            const first = node.v.contents.src[0];
            const last = node.v.contents.src[node.v.contents.src.length - 1];

            if (betweenPosition(termPos(node.v.dictOpen.src), first.position, cPos)) { // << と最初の pair の間
                return { kind: "dict", node: node, state: { kind: "key" }, inTrailer };
            }
            if (last.v.object && betweenPosition(wide(last.v.object.src.position), termPos(node.v.dictClose.src), cPos)) { // 最後の object と >> の間
                return { kind: "dict", node: node, state: { kind: "key" }, inTrailer };
            }
            if (!last.v.object && last.v.name && betweenPosition(wide(last.position), termPos(node.v.dictClose.src), cPos)) { // 最後の object が無いとき、name と >> の間
                return { kind: "dict", node: node, state: { kind: "value", key: last.v.name.src }, inTrailer };
            }
        }

        // pairs 内
        for (let i = 0; i < node.v.contents.src.length; i++) {
            const c = node.v.contents.src[i];

            if (c.v.name && c.v.object && betweenPosition(wide(c.v.name.src.position), c.v.object.src.position, cPos)) { // key と object の間
                return { kind: "dict", node: node, state: { kind: "value", key: c.v.name.src }, inTrailer };
            }

            if (c.v.name && inRange(c.v.name.src.position, cPos)) { // key 内
                return { kind: "dict", node: node, state: { kind: "key" }, inTrailer };
            }
            if (c.v.name && c.v.object && inRange(c.v.object.src.position, cPos)) { // object 内 (key 必須)
                return { kind: "dict", node: node, state: { kind: "value", key: c.v.name.src }, inTrailer };
            }

            // TODO: object のみの pair の key 判定 << /A /B {|} 10 >>
        }

        return { kind: "outside" };
    }
}


function inRange(nodePosition: Position, cursorPosition: number) {
    return nodePosition.start <= cursorPosition && cursorPosition <= nodePosition.stop;
}

function betweenPosition(pos1: Position, pos2: Position, cPos: number) {
    return pos1.stop <= cPos && cPos <= pos2.start;
}

function termPos(term: TerminalNode): Position {
    return tokenToPosition(term.symbol);
}

function tokenToPosition(token: Token): Position {
    return {
        line: token.line,
        column: token.column,
        start: token.start,
        stop: token.stop + 1,
        length: token.stop - token.start + 1
    };
}

function narrow(position: Position): Position {
    return {
        start: position.start + 1,
        stop: position.stop - 1,
        length: position.length,
    };
}

function wide(position: Position): Position {
    return {
        start: position.start - 1,
        stop: position.stop + 1,
        length: position.length,
    };
}
