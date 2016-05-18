"use strict";
exports.nestedVariable = 123;
var Foo;
(function (Foo) {
    var Bar;
    (function (Bar) {
        function fooBarFunction() {
        }
    })(Bar = Foo.Bar || (Foo.Bar = {}));
})(Foo || (Foo = {}));
function aRootLevelFunction() {
}
function functionWithGenerics(a) {
    return a;
}
var EnumSample;
(function (EnumSample) {
    EnumSample[EnumSample["EnumMemberSample"] = 0] = "EnumMemberSample";
})(EnumSample || (EnumSample = {}));
