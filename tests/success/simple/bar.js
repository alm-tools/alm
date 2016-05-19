var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
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
        _super.apply(this, arguments);
    }
    return BarGlobalClassExtension;
}(BarGlobalClass));
