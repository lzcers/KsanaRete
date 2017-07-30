import { uniqueId } from 'lodash';
interface WME {
  identifier: string;
  attribute: string;
  value: string;
}

interface Pattern {
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
    const checkResult = e.value ==  this.pattern.value ? true : false;
    if (checkResult) {
      console.log(`(${e.identifier}, ${e.attribute}, ${e.value})通过模式(${this.pattern.identifier}, ${this.pattern.attribute}, ${this.pattern.value})的常量检查`);
      const AM = <AlphaMemory>this.children[0];
      AM.activation(e);
    } 
    return checkResult;
  }
  activation(e: WME) {
    return this.constantCheck(e);
  }
}

class AlphaMemory extends ReteNode {
  items: Array<WME> = [];
  insertWME(w: WME) {
    this.items.push(w);
  }
  constructor(parent: AlphaNode) {
    super('AlphaMemory', parent);
  }
  activation(e: WME) {
    this.items.push(e);
  }
}

class TypeNode extends ReteNode {
  constructor(parent: ReteNode) {
    super("TypeNode", parent);
  }
  activation(e: WME) {
    this.children.find((i: AlphaNode) => i.activation(e));
  }
}

class JoinNode extends ReteNode {
  leftInput: BetaMemory;
  rightInput: AlphaMemory;

  constructor(parent: AlphaMemory) {
    super("JoinNode", parent);
    this.rightInput = parent;
  }
  leftActivation(w: WME) {

  }
  rightActivation(w: WME) {
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
  items: Array<WME>;
  insertWME(w: WME) {
    this.items.push(w);
  }
  constructor(jNode: JoinNode | null, tokens: Set<Pattern> | null) {
    super('BetaMemory', jNode);
    this.tokens = tokens== null ? new Set() : tokens;
  }
}
function alphaMemoryActivation(AM: AlphaMemory, w: WME) {
  AM.insertWME(w);
  AM.children.forEach((node: JoinNode) => {
    node.rightActivation(w);
  })
}
function betaMemoryLeftActivation(node: BetaMemory, t: Token, w: WME) {

}

export { Pattern, Rule, ReteNode, TypeNode, RootNode, AlphaNode, JoinNode, AlphaMemory, BetaMemory, EndNode, WME };