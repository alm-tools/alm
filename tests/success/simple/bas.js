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
    Test.prototype.aGenericMethod = function (a) {
        return a;
    };
    return Test;
}());
var GenericTest = (function () {
    function GenericTest() {
    }
    return GenericTest;
}());
var Comp = function (props) {
    return React.createElement("div", null, props.text);
};
var comp = React.createElement(Comp, {text: "hello world"});
