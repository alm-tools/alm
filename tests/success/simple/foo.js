"use strict";
exports.foo = 123;
exports.foo;
var Foo = (function () {
    function Foo() {
    }
    Foo.prototype.someMethod = function () {
    };
    return Foo;
}());
exports.Foo = Foo;
