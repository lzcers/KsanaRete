"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rete_1 = require("./rete");
let testRules = [
    {
        LHS: [{ identifier: "a", attribute: "age", value: "20" }, { identifier: "a", attribute: "sex", value: "man" }],
        RHS: function () {
            console.log('r1');
        }
    },
    {
        LHS: [{ identifier: "b", attribute: "age", value: "16" }, { identifier: "a", attribute: "sex", value: "woman" }],
        RHS: function () {
            console.log('r3');
        }
    },
    {
        LHS: [{ identifier: "b", attribute: "age", value: "18" }, { identifier: "a", attribute: "sex", value: "woman" }],
        RHS: function () {
            console.log('r2');
        }
    }
];
const rete = new rete_1.Rete(testRules);
console.log(rete);
rete.traverseRete();
debugger;
//# sourceMappingURL=main.js.map