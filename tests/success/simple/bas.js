"use strict";
var foo_1 = require("./foo");
var bar = foo_1.foo;
function test(a, b, c) {
}
var dom = React.createElement("div", null, 
    React.createElement("img", null)
);
var Test = (function () {
    function Test() {
        this.foo = 123;
    }
    Test.prototype.test = function () {
        return 'asdf' + ("" + this.foo);
    };
    return Test;
}());
