"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rete_1 = require("./rete");
let testRules = [
    {
        LHS: [{ identifier: "<a>", attribute: "age", value: "20" }, { identifier: "a", attribute: "sex", value: "man" }],
        RHS: function () {
            console.log('r1');
        }
    },
    {
        LHS: [{ identifier: "a", attribute: "age", value: "20" }, { identifier: "a", attribute: "sex", value: "woman" }],
        RHS: function () {
            console.log('r2');
        }
    },
    {
        LHS: [{ identifier: "a", attribute: "sex", value: "woman" }, { identifier: "a", attribute: "age", value: "20" }, { identifier: "a", attribute: "age", value: "6" }],
        RHS: function () {
            console.log('r3');
        }
    }
];
const rete = new rete_1.Rete(testRules);
rete.addFact({ identifier: "a", attribute: "age", value: "20" });
rete.addFact({ identifier: "a", attribute: "sex", value: "woman" });
rete.addFact({ identifier: "a", attribute: "age", value: "6" });
rete.addFact({ identifier: "a", attribute: "sex", value: "man" });
// console.log(rete);
// rete.traverseRete(); 
//# sourceMappingURL=main.js.map