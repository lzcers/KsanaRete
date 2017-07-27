"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nodes_1 = require("./nodes");
class Rete {
    set reteRoot(reteRoot) {
        console.log('reteRoot seted...');
        this._reteRoot = reteRoot;
    }
    get reteRoot() {
        return this._reteRoot;
    }
    set rules(rules) {
        this._rules = rules;
    }
    get rules() {
        return this._rules;
    }
    constructor(rules) {
        this.reteRoot = new nodes_1.RootNode();
        this.rules = rules;
        // 拿到每一条rule
        rules.forEach(rule => {
            // 拆开rule里面的每一条模式
            rule.LHS.forEach(pattern => {
                // TypeNode在hashTable中不存在
                if (!this.reteRoot.typeNodeHashTable[pattern.attribute]) {
                    // 则创建该TypeNode与AlphaNode, 并建立父子关系
                    const typeNode = new nodes_1.TypeNode(this.reteRoot);
                    const alphaNode = new nodes_1.AlphaNode(typeNode, pattern);
                    const alphaMemory = new nodes_1.AlphaMemory(alphaNode);
                    this.reteRoot.children.push(typeNode);
                    typeNode.children.push(alphaNode);
                    alphaNode.children.push(alphaMemory);
                    // 建立hashTable索引
                    this.reteRoot.typeNodeHashTable[pattern.attribute] = typeNode;
                }
                else {
                    // 该类型节点已存在，则只创建对应模式的alpha节点
                    const typeNode = this.reteRoot.typeNodeHashTable[pattern.attribute];
                    // 搜索对应模式的alpha节点是否存在，存在就不创建新的alpha节点
                    let aNode = typeNode.children.find((e) => e.patternMatch(pattern));
                    if (aNode == undefined) {
                        const alphaNode = new nodes_1.AlphaNode(typeNode, pattern);
                        const alphaMemory = new nodes_1.AlphaMemory(alphaNode);
                        alphaNode.children.push(alphaMemory);
                        typeNode.children.push(alphaNode);
                    }
                }
            });
        });
    }
    traverseRete() {
        function traverse(node) {
            console.log(`${node.id} is ${node.type}`);
            //DFS 遍历
            node.children.forEach(e => {
                traverse(e);
            });
        }
        traverse(this.reteRoot);
    }
}
exports.Rete = Rete;
//# sourceMappingURL=rete.js.map