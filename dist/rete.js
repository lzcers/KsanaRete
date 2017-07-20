"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var nodes_1 = require("./nodes");
var Rete = (function () {
    function Rete(rules) {
        var _this = this;
        this.reteRoot = new nodes_1.RootNode();
        // 拿到每一条rule
        rules.forEach(function (rule) {
            // 拆开rule里面的每一条模式
            rule.LHS.forEach(function (pattern) {
                // TypeNode在hashTable中不存在
                console.log(_this.reteRoot.hashTable);
                console.log(pattern.attribute);
                if (!_this.reteRoot.hashTable[pattern.attribute]) {
                    // 则创建该TypeNode与AlphaNode, 并建立父子关系
                    var typeNode = new nodes_1.TypeNode(_this.reteRoot);
                    var alphaNode = new nodes_1.AlphaNode(typeNode, pattern);
                    _this.reteRoot.children.push(typeNode);
                    typeNode.children.push(alphaNode);
                    // 建立hashTable索引
                    _this.reteRoot.hashTable[pattern.attribute] = typeNode;
                }
            });
        });
    }
    return Rete;
}());
exports.Rete = Rete;
