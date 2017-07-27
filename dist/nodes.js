"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
class ReteNode {
    constructor(type, parent) {
        this.children = [];
        this.type = type;
        this.parent = parent;
        this.id = lodash_1.uniqueId();
    }
}
exports.ReteNode = ReteNode;
;
class RootNode extends ReteNode {
    constructor() {
        super('RootNode', null);
        this.typeNodeHashTable = {};
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
}
exports.AlphaNode = AlphaNode;
class AlphaMemory extends ReteNode {
    insertWME(w) {
        this.items.push(w);
    }
    constructor(parent) {
        super('AlphaMemory', parent);
    }
}
exports.AlphaMemory = AlphaMemory;
class TypeNode extends ReteNode {
    constructor(parent) {
        super("TypeNode", parent);
    }
}
exports.TypeNode = TypeNode;
class BetaNode extends ReteNode {
    leftActivation(w) {
    }
    rightActivation(w) {
    }
}
exports.BetaNode = BetaNode;
class BetaMemory extends ReteNode {
}
function alphaMemoryActivation(AM, w) {
    AM.insertWME(w);
    AM.successors.forEach(node => {
        node.rightActivation(w);
    });
}
function betaMemoryLeftActivation(node, t, w) {
}
//# sourceMappingURL=nodes.js.map