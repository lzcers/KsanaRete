import { uniqueId } from 'lodash';
interface WME {
  [index: string]: string;
  identifier: string;
  attribute: string;
  value: string;
}

interface Pattern {
  [index: string]: string|undefined;
  pid?: string;
  identifier: string;
  attribute: string;
  value: string;
}

interface Token {
  parent: Token;  
  wme: WME;
}

interface Rule {
  LHS: Array<Pattern>;
  RHS: () => void;
}


class ReteNode {
  id: string;
  type: string;
  children: Array<ReteNode> = [];
  parent: ReteNode | null;
  constructor(type: string, parent: ReteNode | null) {
    this.type = type;
    this.parent = parent;
    this.id = uniqueId();
    console.log(this.id +" "+ this.type);
  }
}
interface ReteNodeHashTable {
   [index: string]: ReteNode;
};

class RootNode extends ReteNode {
  typeNodeHashTable: {[index: string]: ReteNode} = {};
  constructor() {
    super('RootNode', null);
  }
  addFact(e: WME) {
    const typeNode: TypeNode = <TypeNode>this.typeNodeHashTable[e.attribute];
    typeNode != undefined ? typeNode.activation(e) : undefined;
  }
}

class AlphaNode extends ReteNode {
  pattern: Pattern;
  constructor(parent: ReteNode, pattern: Pattern) {
    super('AlphaNode', parent);
    this.pattern = pattern;
    Object.defineProperty(pattern, "pid", { value :  uniqueId('p'), enumerable: false});
  }
  patternMatch(p: Pattern) {
    return  p.attribute == this.pattern.attribute 
            && p.identifier == this.pattern.identifier 
            && p.value == this.pattern.value ? true : false;
  }

  constantCheck(e: WME) {
      // 找出模式里的每一项常量，然后做测试
    const varRegexp =/^<(.*)>$/;
    let checkResult = true;
    for (let i in this.pattern) {
      const patternValue: string = this.pattern[i] || "";
      if (varRegexp.test(patternValue) == false) {
        checkResult = e[i] == patternValue ? true : false;
        // 一旦有一项常量检测未通过，则直接alpha节点测试不通过
        if (!checkResult) break;
      }
    }
    if (checkResult) {
      console.log(`(${e.identifier}, ${e.attribute}, ${e.value})通过模式(${this.pattern.identifier}, ${this.pattern.attribute}, ${this.pattern.value})的常量检查`);
      const AM = <AlphaMemory>this.children[0];
      AM.activation(e, this.pattern);
    } 
    return checkResult;
  }
  activation(e: WME) {
    return this.constantCheck(e);
  }
}

class AlphaMemory extends ReteNode {
  items: Array<WME> = [];
  constructor(parent: AlphaNode) {
    super('AlphaMemory', parent);
  }
  insertFact(e: WME) {
    this.items.push(e);
  }
  activation(e: WME, p: Pattern) {
    this.insertFact(e);
    this.children.forEach((joinNode: JoinNode) => joinNode.rightActivation(e, p));
  }
}

class TypeNode extends ReteNode {
  constructor(parent: ReteNode) {
    super("TypeNode", parent);
  }
  activation(e: WME) {
    this.children.forEach((i: AlphaNode) => i.activation(e));
  }
}

class JoinNode extends ReteNode {
  leftInput: BetaMemory;
  rightInput: AlphaMemory;

  constructor(parent: AlphaMemory) {
    super("JoinNode", parent);
    this.rightInput = parent;
  }
  // return example: 
  // { <X>: "attribute", ...}
  getPatternVar(p: Pattern): {[index: string]: string} {
    const varRegexp =/^<(.*)>$/;
    return Object.keys(p).reduce((pre: any, cur) => {
          const varName = p[cur] || "";
          varRegexp.test(varName) ? pre[varName] = cur : pre;
        return pre;
      }, {});
  }
  checkPatternVar(p: Pattern, v: string) {
    return p.identifier == v || p.attribute == v || p.value == v;
  }
  // return {<varName>: <bindValue>}
  patternInstantiation(varDict: any, w: WME) {
    return Object.keys(varDict).reduce((pre: any, cur) => {
      pre[cur] =  w[varDict[cur]];
      return pre;
    }, {})
  }
  // 返回true 意味着右侧中出现的形参与左侧与之对应的形参其实参相等；
  // 若是左侧模式中没有找到对应的形参则这两条模式是无关联的，可直接join;
  compareTwoPatternActualParam(rp: any, lp: any) {
    let flag = true;
    Object.keys(rp).forEach(e => {
      // 右侧中的形参在左侧模式中出现则必须实参相等，否则这组WME就Join失败
      // 若是右侧中的形参在左侧模式中没有出现，那就可以join
      if(lp[e] != undefined) {
        rp[e] == lp[e] ? flag = true : flag = false;
      }
    })
    return flag;
  }
  leftActivation() {
    const AN = <AlphaNode>this.rightInput.parent;
    let p = AN.pattern;
    let pid = AN.pattern.pid || ""; // 怎么可能为undefined
    let arrTokens = [...this.leftInput.tokens];
    let leftItems = [...this.leftInput.items];
    let rightItems = [...this.rightInput.items];
    let pidLinkPattern = arrTokens.reduce((pre: any, cur) => {
      if(cur.pid != undefined) {
        pre[cur.pid] = cur;
      }
      return pre;
    }, {})

    const varRegexp =/^<(.*)>$/;
    const childNode = this.children[0];
    const varDict = this.getPatternVar(p);
    // 找出所有含有变量的Pattern, 并获得所有模式的变量所对应的属性
    // return example:
    // {
    //   <pid>: {
    //     <varName>: <bindAttr>
    //   }
    // }
    let includesVarParttern =  arrTokens.filter(p => {
      varRegexp.test(p.identifier) 
      || varRegexp.test(p.attribute) 
      || varRegexp.test(p.value)
    }).reduce((pre: any, cur) => {
      const pid = cur.pid;
      if (pid != undefined) {
        pre[pid] = this.getPatternVar(p);
      }
      return pre;
    }, {});
    // join操作，从leftInput, rightInput中取WME开始JOIN操作
    for (let i of rightItems) {
      // 取一个WME实例化一个模式，得到模式中每个变量绑定的实参
      let rightPatternInstantiation =  this.patternInstantiation(varDict, i);
      // 遍历leftInput, 实例化右侧token里的每一个模式与rightPatternInstantiation比对
      // 若果length为0， 则意味着左侧是dummy节点，直接激活下一个就是了;
      if (leftItems.length == 0) {
          // 看下一个节点是EndNode还是BetaMemory
          if (this.children[0].type == "BetaMemory") {
            const successor = <BetaMemory>this.children[0];
             successor.items.push({[pid]: i});
            successor.activation();
          } else if (this.children[0].type == "EndNode") {
            const successor = <EndNode>this.children[0];
            // 执行RHS
            successor.activation();
          }
          continue;
      }
      for (let l of leftItems) {
        // 拿到一个items, 拿到里面每一条WME
        let wholeMatchFlag = true;
        itemMatch: for (let w in l) {
          // 判断下这个模式里有没有变量， includesVarParttern中已经过滤出所有含有变量的模式了
          if (includesVarParttern[w] != undefined) {
            const wme  = l[w];
            // 实例化这条模式
            const leftActualParam = this.patternInstantiation(includesVarParttern[w], wme);
            const result = this.compareTwoPatternActualParam(rightPatternInstantiation, leftActualParam);
            if (result) {
              wholeMatchFlag = true;
              continue;
            } else {
            // 如果当前WME实参不一致，则整个item跳过;    
              wholeMatchFlag = false;
              break itemMatch;
            }
          }
        }
        // tokens里面的全部匹配了？那就把当前从rightInput取出的WME与leftInput中的Items做JOIN操作，作为JoinNode的下一节点的输入
        if (wholeMatchFlag) {
          // 看下一个节点是EndNode还是BetaMemory
          if (this.children[0].type == "BetaMemory") {
            const successor = <BetaMemory>this.children[0];
             successor.items.push({...l, [pid]: i});
            successor.activation();
          } else if (this.children[0].type == "EndNode") {
            const successor = <EndNode>this.children[0];
            // 执行RHS
            successor.activation();
          }
        }
      }
    }    
  }
  rightActivation(e: WME, p: Pattern) {
    let pid = p.pid || ""; // 怎么可能为undefined
    let arrTokens = [...this.leftInput.tokens];
    let leftItems = [...this.leftInput.items];
    let rightItems = [...this.rightInput.items];
    let pidLinkPattern = arrTokens.reduce((pre: any, cur) => {
      if(cur.pid != undefined) {
        pre[cur.pid] = cur;
      }
      return pre;
    }, {})

    const varRegexp =/^<(.*)>$/;
    const childNode = this.children[0];
    const varDict = this.getPatternVar(p);
    // 找出所有含有变量的Pattern, 并获得所有模式的变量所对应的属性
    // return example:
    // {
    //   <pid>: {
    //     <varName>: <bindAttr>
    //   }
    // }
    let includesVarParttern =  arrTokens.filter(p => {
      varRegexp.test(p.identifier) 
      || varRegexp.test(p.attribute) 
      || varRegexp.test(p.value)
    }).reduce((pre: any, cur) => {
      const pid = cur.pid;
      if (pid != undefined) {
        pre[pid] = this.getPatternVar(p);
      }
      return pre;
    }, {});
    // join操作，从leftInput, rightInput中取WME开始JOIN操作
      // 取一个WME实例化一个模式，得到模式中每个变量绑定的实参
      let rightPatternInstantiation =  this.patternInstantiation(varDict, e);
      // 遍历leftInput, 实例化右侧token里的每一个模式与rightPatternInstantiation比对
      // 若果length为0， 则意味着左侧是dummy节点，直接激活下一个就是了;
      if (leftItems.length == 0) {
          // 看下一个节点是EndNode还是BetaMemory
          if (this.children[0].type == "BetaMemory") {
            const successor = <BetaMemory>this.children[0];
             successor.items.push({[pid]: e});
            successor.activation();
          } else if (this.children[0].type == "EndNode") {
            const successor = <EndNode>this.children[0];
            // 执行RHS
            successor.activation();
          }
      }
      for (let l of leftItems) {
        // 拿到一个items, 拿到里面每一条WME
        let wholeMatchFlag = true;
        itemMatch: for (let w in l) {
          // 判断下这个模式里有没有变量， includesVarParttern中已经过滤出所有含有变量的模式了
          if (includesVarParttern[w] != undefined) {
            const wme  = l[w];
            // 实例化这条模式
            const leftActualParam = this.patternInstantiation(includesVarParttern[w], wme);
            const result = this.compareTwoPatternActualParam(rightPatternInstantiation, leftActualParam);
            if (result) {
              wholeMatchFlag = true;
              continue;
            } else {
            // 如果当前WME实参不一致，则整个item跳过;    
              wholeMatchFlag = false;
              break itemMatch;
            }
          }
        }
        // tokens里面的全部匹配了？那就把当前从rightInput取出的WME与leftInput中的Items做JOIN操作，作为JoinNode的下一节点的输入
        if (wholeMatchFlag) {
          // 看下一个节点是EndNode还是BetaMemory
          if (this.children[0].type == "BetaMemory") {
            const successor = <BetaMemory>this.children[0];
             successor.items.push({...l, [pid]: e});
            successor.activation();
          } else if (this.children[0].type == "EndNode") {
            const successor = <EndNode>this.children[0];
            // 执行RHS
            successor.activation();
          }
        }
      }
  }
}

class EndNode extends ReteNode {
  RHS: Function;
  constructor(p: JoinNode, f: Function) {
    super('EndNode', p);
    this.RHS = f;
  }
  activation() {
    this.RHS();
  }
}

class BetaMemory extends ReteNode {
  tokens: Set<Pattern>;
  items: Array<{[idex: string]: WME}> = [];
  insertWME(w:{[idex: string]: WME}) {
    this.items.push(w);
  }
  constructor(jNode: JoinNode | null, tokens: Set<Pattern> | null) {
    super('BetaMemory', jNode);
    this.tokens = tokens== null ? new Set() : tokens;
  }
  activation() {
    this.children.forEach((e: JoinNode) => e.leftActivation());
  }
}

export { Pattern, Rule, ReteNode, TypeNode, RootNode, AlphaNode, JoinNode, AlphaMemory, BetaMemory, EndNode, WME };