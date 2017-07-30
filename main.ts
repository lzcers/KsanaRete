import { Rule, Rete } from './rete';
 
let testRules: Array<Rule> = [
  {
    LHS: [{identifier: "a", attribute: "age", value: "20"}, {identifier: "a", attribute: "sex", value: "man"}],
    RHS: function() {
      console.log('r1');
    }
  },
  {
    LHS: [{identifier: "a", attribute: "age", value: "20"}, {identifier: "a", attribute: "sex", value: "woman"}],
    RHS: function() {
      console.log('r2');
    }
  },
  {
    LHS: [{identifier: "a", attribute: "sex", value: "woman"}, {identifier: "a", attribute: "age", value: "20"},  {identifier: "a", attribute: "age", value: "6"}],
    RHS: function() {
      console.log('r3');
    }
  }
]

const rete = new Rete(testRules);
rete.addFact({identifier: "a", attribute: "age", value: "20"});
// console.log(rete);
// rete.traverseRete();
debugger;