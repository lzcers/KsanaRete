"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var ReteNode = (function () {
    function ReteNode(type, parent) {
        this.type = type;
        this.parent = parent;
    }
    return ReteNode;
}());
exports.ReteNode = ReteNode;
;
var RootNode = (function (_super) {
    __extends(RootNode, _super);
    function RootNode() {
        var _this = _super.call(this, 'RootNode', null) || this;
        _this.hashTable = {};
        return _this;
    }
    return RootNode;
}(ReteNode));
exports.RootNode = RootNode;
var AlphaNode = (function (_super) {
    __extends(AlphaNode, _super);
    function AlphaNode(parent, pattern) {
        var _this = _super.call(this, 'AlphaNode', parent) || this;
        _this.pattern = pattern;
        return _this;
    }
    return AlphaNode;
}(ReteNode));
exports.AlphaNode = AlphaNode;
var AlphaMemory = (function (_super) {
    __extends(AlphaMemory, _super);
    function AlphaMemory() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AlphaMemory.prototype.insertWME = function (w) {
        this.items.push(w);
    };
    return AlphaMemory;
}(ReteNode));
var TypeNode = (function (_super) {
    __extends(TypeNode, _super);
    function TypeNode(parent) {
        return _super.call(this, "TypeNode", parent) || this;
    }
    return TypeNode;
}(ReteNode));
exports.TypeNode = TypeNode;
var BetaNode = (function (_super) {
    __extends(BetaNode, _super);
    function BetaNode() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    BetaNode.prototype.leftActivation = function (w) {
    };
    BetaNode.prototype.rightActivation = function (w) {
    };
    return BetaNode;
}(ReteNode));
exports.BetaNode = BetaNode;
var BetaMemory = (function (_super) {
    __extends(BetaMemory, _super);
    function BetaMemory() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return BetaMemory;
}(ReteNode));
function alphaMemoryActivation(AM, w) {
    AM.insertWME(w);
    AM.successors.forEach(function (node) {
        node.rightActivation(w);
    });
}
function betaMemoryLeftActivation(node, t, w) {
}
