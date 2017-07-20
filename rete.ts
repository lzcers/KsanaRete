import { Pattern, Rule, ReteNode, RootNode, TypeNode, AlphaNode, BetaNode } from './nodes';

class Rete {
  reteRoot: RootNode;
  rules:  Array<Rule>;

  constructor(rules: Array<Rule>) {
    this.reteRoot  = new RootNode();
    // 拿到每一条rule
    rules.forEach(rule => {
      // 拆开rule里面的每一条模式
      rule.LHS.forEach(pattern => {
        // TypeNode在hashTable中不存在
        if(!this.reteRoot.hashTable[pattern.attribute]) {
          // 则创建该TypeNode与AlphaNode, 并建立父子关系
          const typeNode = new TypeNode(this.reteRoot);
          const alphaNode = new AlphaNode(typeNode, pattern);
          this.reteRoot.children.push(typeNode);
          typeNode.children.push(alphaNode);
          // 建立hashTable索引
          this.reteRoot.hashTable[pattern.attribute] = typeNode;
        }
      })
    });
  }
}

export { Rule, Rete };