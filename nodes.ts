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
    this.pattern.pid = uniqueId('p');
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
    this.children.forEach((joinNode: JoinNode) => joinNode.activation(e, p));
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
  checkPatternVar(p: Pattern, v: string) {
    return p.identifier == v || p.attribute == v || p.value == v;
  }
  // return {varName: bindValue}
  patternInstantiation(varDict: any, w: WME) {
    Object.keys(varDict).reduce((pre: any, cur) => {
      let varName = varDict[cur];
      pre[varName] = w[cur];
      return pre;
    }, {})
    return varDict
  }

  activation(e: WME, p: Pattern) {
    let arrTokens = [...this.leftInput.tokens];
    let leftItems = this.leftInput.items;
    let rightItems = this.rightInput.items;
    let pidLinkPattern = arrTokens.reduce((pre: any, cur) => {
      if(cur.pid != undefined) {
        pre[cur.pid] = cur;
      }
      return pre;
    }, {})

    const varRegexp =/^<(.*)>$/;
    const childNode = this.children[0];
    const varDict = Object.keys(p).reduce((pre: any, cur: string) => {
        if (varRegexp.test(<string>p[cur])) {
          pre[cur]= p[cur];
      }
      return pre;
    }, {});
    // 找出所有含有变量的Pattern
    let includesVarParttern =  arrTokens.filter(p => varRegexp.test(p.identifier) || varRegexp.test(p.attribute) || varRegexp.test(p.value));
    // let varLinkPattern = 
    // todo JOIN操作
    // Object.keys(varDict).filter((v: string) => {
    //   includesVarParttern.forEach(p => {
    //     // 当前的Pattern里有该变量
    //     if (this.checkPatternVar(p, varDict[v])) {
    //       // 取出WME实例化该模式，绑定上变量；
    //       rightItems.forEach(i => i[v])
    //     }
    //   })
    // })
    // 拉出一组匹配的WME
    // [{pid: WME, ...}]

    rightItems.forEach(i => {
      let InstantiationPattern =  this.patternInstantiation(varDict, i);

      // Object.keys(i).forEach(pid => {
      //   // 模式实例化
      //   checkPatternVar(pidLinkPattern[pid], )
      // })
    })
  }
}

class EndNode extends ReteNode {
  RHS: Function;
  constructor(p: JoinNode, f: Function) {
    super('EndNode', p);
    this.RHS = f;
  }
}

class BetaMemory extends ReteNode {
  tokens: Set<Pattern>;
  items: Array<{[idex: string]: WME}>;
  insertWME(w:{[idex: string]: WME}) {
    this.items.push(w);
  }
  constructor(jNode: JoinNode | null, tokens: Set<Pattern> | null) {
    super('BetaMemory', jNode);
    this.tokens = tokens== null ? new Set() : tokens;
  }
}

export { Pattern, Rule, ReteNode, TypeNode, RootNode, AlphaNode, JoinNode, AlphaMemory, BetaMemory, EndNode, WME };