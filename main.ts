import { Rule, Rete } from './rete';
 
let testRules: Array<Rule> = [
  {
    LHS: [{identifier: "a", attribute: "age", value: "20"}, {identifier: "a", attribute: "sex", value: "man"}],
    RHS: function() {
      console.log('r1');
    }
  },
  {
    LHS: [{identifier: "b", attribute: "age", value: "16"}, {identifier: "a", attribute: "sex", value: "woman"}],
    RHS: function() {
      console.log('r3');
    }
  },
  {
    LHS: [{identifier: "b", attribute: "age", value: "18"}, {identifier: "a", attribute: "sex", value: "woman"}],
    RHS: function() {
      console.log('r2');
    }
  }
]

console.log(new Rete(testRules));
