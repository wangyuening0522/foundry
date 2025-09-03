"use strict";
// packages/utils/src/index.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.greet = exports.sum = void 0;
function sum(a, b) {
    return a + b;
}
exports.sum = sum;
function greet(name) {
    return `Hello, ${name}!`;
}
exports.greet = greet;
console.log("utils loaded");
