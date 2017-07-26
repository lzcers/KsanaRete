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
}

class AlphaMemory extends ReteNode {
  items: Array<WME>;
  successors: Array<BetaNode>;
  insertWME(w: WME) {
    this.items.push(w);
  }
}

class TypeNode extends ReteNode {
  constructor(parent: ReteNode) {
    super("TypeNode", parent);
  }
}

class BetaNode extends ReteNode {
  leftActivation(w: WME) {

  }
  rightActivation(w: WME) {
  }
}

class BetaMemory extends ReteNode {
  items: Array<Token>;
}

function alphaMemoryActivation(AM: AlphaMemory, w: WME) {
  AM.insertWME(w);
  AM.successors.forEach(node => {
    node.rightActivation(w);
  })
}
function betaMemoryLeftActivation(node: BetaMemory, t: Token, w: WME) {

}

export { Pattern, Rule, ReteNode, TypeNode, RootNode, AlphaNode, BetaNode };