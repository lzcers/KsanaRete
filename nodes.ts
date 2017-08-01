import { uniqueId } from 'lodash';
interface WME {
  [index: string]: string;
  identifier: string;
  attribute: string;
  value: string;
}

interface Pattern {
  [index: string]: string;
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
      const patternValue: string = this.pattern[i];
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
  items: {[index: string]: any;} = {};
  constructor(parent: AlphaNode) {
    super('AlphaMemory', parent);
  }
  insertFact(e: WME) {
    const attribute = e.attribute;
    const value = e.value;
    this.items[e.identifier] = {[attribute]: value};
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
  activation(e: WME, p: Pattern) {
    let arrTokens = [...this.leftInput.tokens];
    const varRegexp =/^<(.*)>$/;
    const childNode = this.children[0];
    const varDict = Object.keys(p).reduce((pre: any, cur: string) => {
      if (varRegexp.test(p[cur])) {
        pre[cur]= p[cur];
      }
      return pre;
    }, {});

    // todo JOIN算法
    Object.keys(varDict).filter((v: string) => {
      // 从leftInput中找到与rightInput规则有变量交集的规则
      let includesVarParttern =  arrTokens.filter(p => {
        return this.checkPatternVar(p, varDict[v]);
      })
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
  items: Array<Array<WME>>;
  insertWME(w: Array<WME>) {
    this.items.push(w);
  }
  constructor(jNode: JoinNode | null, tokens: Set<Pattern> | null) {
    super('BetaMemory', jNode);
    this.tokens = tokens== null ? new Set() : tokens;
  }
}

export { Pattern, Rule, ReteNode, TypeNode, RootNode, AlphaNode, JoinNode, AlphaMemory, BetaMemory, EndNode, WME };