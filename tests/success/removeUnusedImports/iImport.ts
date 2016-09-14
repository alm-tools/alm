import {
    dontUseMe1,
    dontUseMe2,
    DontUseMe1,
    useMe1,
    useMe2,
    UseMe1
} from './iExport';
import {
    dontUseMe1 as againDontUseMe1,
    dontUseMe2 as againDontUseMe2,
    DontUseMe1 as AgainDontUseMe1,
} from './iExport';
import * as useMeLocal1 from "./iExport";
import * as dontUseMeLocal1 from "./iExport";
import useMeLocal2 = require("./iExport");
import dontUseMeLocal2 = require("./iExport");
