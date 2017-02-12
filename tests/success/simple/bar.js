var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var bar = 123;
function barFunc() {
}
var BarEnum;
(function (BarEnum) {
    BarEnum[BarEnum["BarEnumMember"] = 0] = "BarEnumMember";
})(BarEnum || (BarEnum = {}));
var BarGlobalClass = (function () {
    function BarGlobalClass() {
    }
    return BarGlobalClass;
}());
var BarGlobalClassExtension = (function (_super) {
    __extends(BarGlobalClassExtension, _super);
    function BarGlobalClassExtension() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return BarGlobalClassExtension;
}(BarGlobalClass));
var Foo;
(function (Foo) {
    var Bar;
    (function (Bar) {
        var Bas;
        (function (Bas) {
            var InNameSapce = (function () {
                function InNameSapce() {
                }
                return InNameSapce;
            }());
            Bas.InNameSapce = InNameSapce;
            var InNameSpaceInheritance = (function (_super) {
                __extends(InNameSpaceInheritance, _super);
                function InNameSpaceInheritance() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                return InNameSpaceInheritance;
            }(BarGlobalClass));
            Bas.InNameSpaceInheritance = InNameSpaceInheritance;
        })(Bas = Bar.Bas || (Bar.Bas = {}));
    })(Bar = Foo.Bar || (Foo.Bar = {}));
})(Foo || (Foo = {}));
