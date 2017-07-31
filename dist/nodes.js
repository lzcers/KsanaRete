"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
class ReteNode {
    constructor(type, parent) {
        this.children = [];
        this.type = type;
        this.parent = parent;
        this.id = lodash_1.uniqueId();
        console.log(this.id + " " + this.type);
    }
}
exports.ReteNode = ReteNode;
;
class RootNode extends ReteNode {
    constructor() {
        super('RootNode', null);
        this.typeNodeHashTable = {};
    }
    addFact(e) {
        const typeNode = this.typeNodeHashTable[e.attribute];
        typeNode != undefined ? typeNode.activation(e) : undefined;
    }
}
exports.RootNode = RootNode;
class AlphaNode extends ReteNode {
    constructor(parent, pattern) {
        super('AlphaNode', parent);
        this.pattern = pattern;
    }
    patternMatch(p) {
        return p.attribute == this.pattern.attribute
            && p.identifier == this.pattern.identifier
            && p.value == this.pattern.value ? true : false;
    }
    constantCheck(e) {
        // 找出模式里的每一项常量，然后做测试
        const varRegexp = /^<(.*)>$/;
        let checkResult = true;
        for (let i in this.pattern) {
            const patternValue = this.pattern[i];
            if (varRegexp.test(patternValue) == false) {
                checkResult = e[i] == patternValue ? true : false;
                // 一旦有一项常量检测未通过，则直接alpha节点测试不通过
                if (!checkResult)
                    break;
            }
        }
        if (checkResult) {
            console.log(`(${e.identifier}, ${e.attribute}, ${e.value})通过模式(${this.pattern.identifier}, ${this.pattern.attribute}, ${this.pattern.value})的常量检查`);
            const AM = this.children[0];
            AM.activation(e);
        }
        return checkResult;
    }
    activation(e) {
        return this.constantCheck(e);
    }
}
exports.AlphaNode = AlphaNode;
class AlphaMemory extends ReteNode {
    constructor(parent) {
        super('AlphaMemory', parent);
        this.items = {};
    }
    insertFact(e) {
        const attribute = e.attribute;
        const value = e.value;
        this.items[e.identifier] = { [attribute]: value };
    }
    activation(e) {
        this.insertFact(e);
        this.children.forEach((joinNode) => joinNode.rightActivation(e));
    }
}
exports.AlphaMemory = AlphaMemory;
class TypeNode extends ReteNode {
    constructor(parent) {
        super("TypeNode", parent);
    }
    activation(e) {
        this.children.forEach((i) => i.activation(e));
    }
}
exports.TypeNode = TypeNode;
class JoinNode extends ReteNode {
    constructor(parent) {
        super("JoinNode", parent);
        this.rightInput = parent;
    }
    leftActivation(w) {
    }
    rightActivation(w) {
        console.log('test');
    }
}
exports.JoinNode = JoinNode;
class EndNode extends ReteNode {
    constructor(p, f) {
        super('EndNode', p);
        this.RHS = f;
    }
}
exports.EndNode = EndNode;
class BetaMemory extends ReteNode {
    insertWME(w) {
        this.items.push(w);
    }
    constructor(jNode, tokens) {
        super('BetaMemory', jNode);
        this.tokens = tokens == null ? new Set() : tokens;
    }
}
exports.BetaMemory = BetaMemory;
//# sourceMappingURL=nodes.js.map