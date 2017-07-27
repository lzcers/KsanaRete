import { Pattern, Rule, ReteNode, RootNode, TypeNode, AlphaNode, JoinNode, AlphaMemory, BetaMemory } from './nodes';

class Rete {
  private _reteRoot: RootNode;
  private _rules:  Array<Rule>;

  set reteRoot(reteRoot: RootNode) {
    console.log('reteRoot seted...');
    this._reteRoot = reteRoot;
  }
  get reteRoot() {
    return this._reteRoot;
  }
  set rules(rules: Array<Rule>) {
    this._rules = rules;
  }
  get rules() {
    return this._rules;
  }

  constructor(rules: Array<Rule>) {
    this.reteRoot  = new RootNode();
    this.rules = rules;
    // 拿到每一条rule
    rules.forEach(rule => {
      let alphaMemoryStack: Array<AlphaMemory> = [];
      let rulesPatternSet: Set<Pattern> = new Set();
      // 拆开rule里面的每一条模式
      rule.LHS.forEach(pattern => {
        rulesPatternSet.add(pattern);
        // TypeNode在hashTable中不存在
        if(!this.reteRoot.typeNodeHashTable[pattern.attribute]) {
          // 则创建该TypeNode与AlphaNode, 并建立父子关系
          const typeNode = new TypeNode(this.reteRoot);
          const alphaNode = new AlphaNode(typeNode, pattern);
          const alphaMemory = new AlphaMemory(alphaNode);

          this.reteRoot.children.push(typeNode);
          typeNode.children.push(alphaNode);
          alphaNode.children.push(alphaMemory);

          // 加入栈，为后续创建Join节点使用
          alphaMemoryStack.push(alphaMemory);
          // 建立hashTable索引
          this.reteRoot.typeNodeHashTable[pattern.attribute] = typeNode;
        } else {
          // 该类型节点已存在，则只创建对应模式的alpha节点
          const typeNode = this.reteRoot.typeNodeHashTable[pattern.attribute];
          // 搜索对应模式的alpha节点是否存在，存在就不创建新的alpha节点
          let aNode = typeNode.children.find((e: AlphaNode) =>  e.patternMatch(pattern));
           if(aNode == undefined) {
            const alphaNode = new AlphaNode(typeNode, pattern);
             const alphaMemory = new AlphaMemory(alphaNode);
            typeNode.children.push(alphaNode);
             alphaNode.children.push(alphaMemory);

             alphaMemoryStack.push(alphaMemory);
           } else {
             // 取该模式的alphaNode的Memory放入栈
              alphaMemoryStack.push(<AlphaMemory>aNode.children[0]);
           }
        }
      })
      let betaMemoryStack: Array<BetaMemory> = [];

      // 然后开始创建Beta网络的节点
      while (alphaMemoryStack.length != 0) {
        let aMemoryNode: AlphaMemory | undefined = alphaMemoryStack.shift();
        // 当前alphaMemory为新建节点
        if (aMemoryNode != undefined && aMemoryNode.children.length == 0) {
          let joinNode = new JoinNode(aMemoryNode);
          let betaMemory = new BetaMemory();
          joinNode.leftInput = betaMemory;
        }  else if (aMemoryNode != undefined && aMemoryNode.children.length > 0) {
          // 该alphaMemoryNode非新建的，则要搜索是否存在能够部分匹配模式的节点
          aMemoryNode.children.forEach((node: JoinNode) => {
            // null
            if (node.leftInput.items != null) {
              let flag = true;
              rulesPatternSet.forEach(p => {
                const items = node.leftInput.items || new Set<Pattern>();
                flag = items.has(p);
              })
            } 
          })
        }
      }
    });
  }

  traverseRete() {
    function traverse(node: ReteNode) {
      console.log(`${node.id} is ${node.type}`);
      //DFS 遍历
      node.children.forEach(e => {
        traverse(e);
      });
    }
    traverse(this.reteRoot);
  }
}

export { Rule, Rete };