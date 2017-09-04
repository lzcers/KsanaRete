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
        Object.defineProperty(pattern, "pid", { value: lodash_1.uniqueId('p'), enumerable: false });
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
            const patternValue = this.pattern[i] || "";
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
            AM.activation(e, this.pattern);
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
        this.items = [];
    }
    insertFact(e) {
        this.items.push(e);
    }
    activation(e, p) {
        this.insertFact(e);
        this.children.forEach((joinNode) => joinNode.rightActivation(e, p));
    }
}
exports.AlphaMemory = AlphaMemory;
class TypeNode extends ReteNode {
    constructor(parent) {
        super("TypeNode", parent);
    }
    activation(e) {
        this.children.forEach(i => i.activation(e));
    }
}
exports.TypeNode = TypeNode;
class JoinNode extends ReteNode {
    constructor(parent) {
        super("JoinNode", parent);
        this.rightInput = parent;
    }
    // return example: 
    // { <X>: "attribute", ...}
    getPatternVar(p) {
        const varRegexp = /^<(.*)>$/;
        return Object.keys(p).reduce((pre, cur) => {
            const varName = p[cur] || "";
            varRegexp.test(varName) ? pre[varName] = cur : pre;
            return pre;
        }, {});
    }
    checkPatternVar(p, v) {
        return p.identifier == v || p.attribute == v || p.value == v;
    }
    // return {<varName>: <bindValue>}
    patternInstantiation(varDict, w) {
        return Object.keys(varDict).reduce((pre, cur) => {
            pre[cur] = w[varDict[cur]];
            return pre;
        }, {});
    }
    // 返回true 意味着右侧中出现的形参与左侧与之对应的形参其实参相等；
    // 若是左侧模式中没有找到对应的形参则这两条模式是无关联的，可直接join;
    compareTwoPatternActualParam(rp, lp) {
        let flag = true;
        Object.keys(rp).forEach(e => {
            // 右侧中的形参在左侧模式中出现则必须实参相等，否则这组WME就Join失败
            // 若是右侧中的形参在左侧模式中没有出现，那就可以join
            if (lp[e] != undefined) {
                rp[e] == lp[e] ? flag = true : flag = false;
            }
        });
        return flag;
    }
    // 找出所有含有变量的Pattern, 并获得所有模式的变量所对应的属性
    // return example:
    // {
    //   <pid>: {
    //     <varName>: <bindAttr>
    //   }
    // }
    includesVarParttern() {
        const varRegexp = /^<(.*)>$/;
        return [...this.leftInput.tokens].filter(p => {
            return varRegexp.test(p.identifier)
                || varRegexp.test(p.attribute)
                || varRegexp.test(p.value);
        }).reduce((pre, cur) => {
            const pid = cur.pid;
            if (pid != undefined) {
                pre[pid] = this.getPatternVar(cur);
            }
            return pre;
        }, {});
    }
    successorActivation(wmes) {
        // 看下一个节点是EndNode还是BetaMemory
        if (this.children[0].type == "BetaMemory") {
            const successor = this.children[0];
            successor.items.push(wmes);
            console.log(Object.keys(wmes).toString() + `模式部分匹配，激活BetaMemory节点！`);
            successor.activation();
        }
        else if (this.children[0].type == "EndNode") {
            const successor = this.children[0];
            // 执行RHS
            console.log(Object.keys(wmes).toString() + `模式全匹配，下一节点为EndNode，执行其RHS！`);
            successor.activation();
        }
    }
    joinOption(leftItems, rightItems) {
        const AN = this.rightInput.parent;
        let p = AN.pattern;
        let pid = AN.pattern.pid || ""; // 怎么可能为undefined
        const varDict = this.getPatternVar(p);
        // 找出所有含有变量的Pattern, 并获得所有模式的变量所对应的属性
        // return example:
        // {
        //   <pid>: {
        //     <varName>: <bindAttr>
        //   }
        // }
        let includesVarParttern = this.includesVarParttern();
        console.log(includesVarParttern);
        // join操作，从leftInput, rightInput中取WME开始JOIN操作
        for (let i of rightItems) {
            // 取一个WME实例化一个模式，得到模式中每个变量绑定的实参
            let rightPatternInstantiation = this.patternInstantiation(varDict, i);
            // 遍历leftInput, 实例化右侧token里的每一个模式与rightPatternInstantiation比对
            // 若果length为0， 则意味着左侧是dummy节点，直接激活下一个就是了;
            if (leftItems.length == 0) {
                this.successorActivation({ [pid]: i });
                continue;
            }
            for (let l of leftItems) {
                // 拿到一个items, 拿到里面每一条WME
                let wholeMatchFlag = true;
                itemMatch: for (let w in l) {
                    // 判断下这个模式里有没有变量， includesVarParttern中已经过滤出所有含有变量的模式了
                    if (includesVarParttern[w] != undefined) {
                        const wme = l[w];
                        // 实例化这条模式
                        const leftActualParam = this.patternInstantiation(includesVarParttern[w], wme);
                        const result = this.compareTwoPatternActualParam(rightPatternInstantiation, leftActualParam);
                        if (result) {
                            wholeMatchFlag = true;
                            continue;
                        }
                        else {
                            // 如果当前WME实参不一致，则整个item跳过;    
                            wholeMatchFlag = false;
                            break itemMatch;
                        }
                    }
                }
                // tokens里面的全部匹配了？那就把当前从rightInput取出的WME与leftInput中的Items做JOIN操作，作为JoinNode的下一节点的输入
                if (wholeMatchFlag) {
                    this.successorActivation(Object.assign({}, l, { [pid]: i }));
                }
            }
        }
    }
    leftActivation() {
        let leftItems = [...this.leftInput.items];
        let rightItems = [...this.rightInput.items];
        this.joinOption(leftItems, rightItems);
    }
    rightActivation(e, p) {
        let leftItems = [...this.leftInput.items];
        this.joinOption(leftItems, [e]);
    }
}
exports.JoinNode = JoinNode;
class EndNode extends ReteNode {
    constructor(p, f) {
        super('EndNode', p);
        this.RHS = f;
    }
    activation() {
        this.RHS();
    }
}
exports.EndNode = EndNode;
class BetaMemory extends ReteNode {
    constructor(jNode, tokens) {
        super('BetaMemory', jNode);
        this.items = [];
        this.tokens = tokens == null ? new Set() : tokens;
    }
    insertWME(w) {
        this.items.push(w);
    }
    activation() {
        this.children.forEach((e) => e.leftActivation());
    }
}
exports.BetaMemory = BetaMemory;
//# sourceMappingURL=nodes.js.map