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
