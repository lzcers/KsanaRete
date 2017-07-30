import { Pattern, Rule, ReteNode, RootNode, TypeNode, AlphaNode, JoinNode, AlphaMemory, BetaMemory, EndNode, WME } from './nodes';

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
  return aIsSubsetOfB;
}
class Rete {
  private _reteRoot: RootNode;
  private _rules:  Array<Rule>;
  private _workMemory: { [index: string]: any } = {};

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
  get workMemory() {
    return this._workMemory;
  }
  set workMemory(WMEs: { [index: string]: any }) {
    this.workMemory = WMEs;
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
      
      // 然后开始创建Beta网络的节点
      // 搜索能够复用的BetaMemory，该BetaMemory的token是 rulePatternSet的最大子集;
    
      let maxMatchTokensNode: BetaMemory |undefined;
      let maxMatchTokensNodeSize =  0;
      searchLoop: for (const e of alphaMemoryStack) {
        const jNodes = <Array<JoinNode>>e.children;
        for (const j of jNodes) {
          // 如果该alphaMemory链接的JoinNode其左输入的tokens比当前的rulePatternSet大，就跳过了。
          // 因为意味着，假设当前规则的模式为c1&&c2&&c3, tokens.size为3， 而匹配的leftInputNode的模式数量比当前规则多，
          // 则该leftInputNode显然不能复用
          // 进行子集检查，看是否能否复用
          
          if (j.children[0].type != "EndNode") {
            const betaMemoryNode = <BetaMemory> j.children[0];
            // 该BetaMemory的tokens集合大小显然不能大于当前规则的模式数；
            if (betaMemoryNode.tokens != null && betaMemoryNode.tokens.size  <= rulePatternSet.size) {
              // 匹配
              if (patternSubsetCheck(betaMemoryNode.tokens, rulePatternSet)  && betaMemoryNode.tokens.size > maxMatchTokensNodeSize) {
                maxMatchTokensNode = betaMemoryNode;
                maxMatchTokensNodeSize = maxMatchTokensNode.tokens.size;
              }
            }
          } else {
            const betaMemoryNode = <BetaMemory> j.leftInput;
            // 该BetaMemory的tokens集合大小显然不能大于当前规则的模式数；
            if (betaMemoryNode.tokens != null && betaMemoryNode.tokens.size  <= rulePatternSet.size) {
              // 匹配
              if (patternSubsetCheck(betaMemoryNode.tokens, rulePatternSet) && betaMemoryNode.tokens.size > maxMatchTokensNodeSize) {
                maxMatchTokensNode = betaMemoryNode;
                maxMatchTokensNodeSize = maxMatchTokensNode.tokens.size;
              }
            }
          }

          // 已经找到最大匹配的token了，不找了
          if (rulePatternSet.size - maxMatchTokensNodeSize == 1) {
            break searchLoop;
          }
        }
      }
      
      // 好了， 我们拿到这个最大的匹配的betaMemory来构建join节点吧
      // 首先我们看看这个最大匹配的betaMemory到底匹配了当前规则中的几个模式；
      // 假设当前规则为c1&v2&c3&c4, 然后我们找到的这个betaMemory的tokens是 c1&c2&c3
      // 那么我们就要构造一个join节点把这个betaMemory做为join节点的leftInput, c4的alphaMemory作为rightInput
      // if (maxMatchTokensNode.tokens != null) {
        // 找到不在这个token里面的模式，建立Join节点 
        let nodesOfWillCreateJoinNode = [];
        for (const e of alphaMemoryStack) {
          const aNode =  <AlphaNode>e.parent;
          const pattern = aNode.pattern;
          const arrMaxTokens = maxMatchTokensNode != undefined ? [...maxMatchTokensNode.tokens] : [];
          const result = arrMaxTokens.find(p => {
            return  pattern.attribute == p.attribute 
              && pattern.identifier == p.identifier 
              && pattern.value == p.value ? true : false;
          });    
          // 在最大串里找不到的模式将会创建join节点; 
          result == undefined ? nodesOfWillCreateJoinNode.push(e) : undefined;
        }

        let preBetaMemoryNode: BetaMemory  = maxMatchTokensNode != undefined ? maxMatchTokensNode : new BetaMemory(null, null);
        while (nodesOfWillCreateJoinNode.length > 0) {
          const aM = nodesOfWillCreateJoinNode.shift();
          let jNode: JoinNode;
          if (aM != undefined) {
            jNode = new JoinNode(aM);
            aM.children.push(jNode);
            jNode.leftInput = preBetaMemoryNode;
            jNode.leftInput.children.push(jNode);
            // 已经空了，那就是最后一个模式已经建立好Join节点了
            // 将规则的RHS作为该joinNode的子节点
            if (nodesOfWillCreateJoinNode.length == 0) {
              jNode.children[0] = new EndNode(jNode, rule.RHS);
            }
            else {
              // 创建新的betaMemory
              const aNode = <AlphaNode>aM.parent;
              const newTokens = new Set([...jNode.leftInput.tokens, aNode.pattern]);
              
              jNode.children[0] = new BetaMemory(jNode, newTokens);
              preBetaMemoryNode = <BetaMemory>jNode.children[0];
            }
          }
        }
      // }  
    });
  }
  addFact(WME: WME) {
    let element = this.workMemory[WME.identifier] || {};
    element[WME.attribute] = WME.value;
    this.workMemory[WME.identifier] = element;
    this.reteRoot.addFact(WME);
  }
  traverseRete() {
    let tempStack: any = [];
    function traverse(node: ReteNode) {
      console.log(`${node.id} is ${node.type}`);
      node.children.forEach(e => {
        traverse(e)    
      });
    }
    traverse(this.reteRoot);
  }

}

export { Rule, Rete };