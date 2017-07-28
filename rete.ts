import { Pattern, Rule, ReteNode, RootNode, TypeNode, AlphaNode, JoinNode, AlphaMemory, BetaMemory } from './nodes';

  function patternMatch(p1: Pattern, p2: Pattern) {
    return  p1.attribute == p2.attribute 
            && p1.identifier == p2.identifier 
            && p1.value == p2.value ? true : false;
  }

// 确定A是否是B的子集
function patternSubsetCheck(a: Set<Pattern>, b: Set<Pattern>) {
  let aArray = [...a];
  let bArray = [...b];
  let aIsSubsetOfB = aArray.reduce((pre: boolean, cur: Pattern) => {
    // aEInBarray != undefined ，则意味则当前元素在B集合中；
    let aEInbArray = bArray.find(e => patternMatch(cur, e));
    let flag: boolean = aEInbArray != undefined ? true : false;
    return pre&&flag;
  }, true)
  
}
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
      let rulePatternSet: Set<Pattern> = new Set();
      // 拆开rule里面的每一条模式
      rule.LHS.forEach(pattern => {
        rulePatternSet.add(pattern);
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
             // 取该模式的alphaMemoryNode放入栈
              alphaMemoryStack.push(<AlphaMemory>aNode.children[0]);
           }
        }
      })
      let betaMemoryStack: Array<BetaMemory> = [];

      // 然后开始创建Beta网络的节点
      while (alphaMemoryStack.length != 0) {
        // 搜索能够复用的BetaMemory
        alphaMemoryStack.forEach(e => {
          e.children.forEach((j: JoinNode) => {
            // 如果该alphaMemory链接的JoinNode其左输入的tokens比当前的rulePatternSet大，就跳过了。
            // 因为意味着，假设当前规则的模式为c1&&c2&&c3, tokens.size为3， 而匹配的leftInputNode的模式数量比当前规则多，
            // 则该leftInputNode显然不能复用
            if (j.children[0].type != "EndNode") {
              const betaMemoryNode = <BetaMemory>j.children[0];
              if (betaMemoryNode.tokens != null && betaMemoryNode.tokens.size  <= rulePatternSet.size) {
                // 匹配
              } else {

              }
            } else {
              const betaMemoryNode = <BetaMemory>j.leftInput;
              if (betaMemoryNode.tokens != null && betaMemoryNode.tokens.size  <= rulePatternSet.size) {
                // 匹配
              } else {

              }
            }
          })
        })
        // let aMemoryNode: AlphaMemory | undefined = alphaMemoryStack.shift();
        // 当前alphaMemory为新建节点
        // if (aMemoryNode != undefined && aMemoryNode.children.length == 0) {
        //   let joinNode = new JoinNode(aMemoryNode);
        //   let betaMemory = new BetaMemory();
        //   joinNode.leftInput = betaMemory;
        // }  else if (aMemoryNode != undefined && aMemoryNode.children.length > 0) {
        //   // 该alphaMemoryNode非新建的，则要搜索是否存在能够部分匹配模式的节点
        //   aMemoryNode.children.forEach((node: JoinNode) => {
        //     // null
        //     if (node.leftInput.items != null) {
        //       let flag = true;
        //       rulesPatternSet.forEach(p => {
        //         const items = node.leftInput.items || new Set<Pattern>();
        //         flag = items.has(p);
        //       })
        //     } 
        //   })
        // }
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