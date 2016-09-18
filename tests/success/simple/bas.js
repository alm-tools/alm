"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var foo_1 = require("./foo");
var bar = foo_1.foo;
function test(x, y, z) {
}
var dom = React.createElement("div", null,
    React.createElement("img", null));
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
var comp = React.createElement(Comp, { text: "hello world" });
var Bas = (function (_super) {
    __extends(Bas, _super);
    function Bas() {
        _super.apply(this, arguments);
    }
    Bas.prototype.someMethod = function () {
    };
    return Bas;
}(foo_1.Foo));
exports.Bas = Bas;
var jsonToDtsTesting = "\n{\n  foo: 123,\n  bar: {\n    bas: \"Hello\",\n    baz: {\n      qux: \"World\"\n    }\n  }\n}\n";
