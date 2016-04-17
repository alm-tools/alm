import {triggeredDebounce} from "../common/utils";
import * as assert from "assert";

function triggeredDebounceTest() {
    let callcount = 0;
    const foo = triggeredDebounce({
        func: (x: string) => {
            console.log('called: ',x);
            callcount++;
        },
        mustcall: (n, o) => o && n !== o,
        milliseconds: 2000
    });

    foo('1');
    foo('1');
    foo('1');
    foo('1');
    assert.equal(callcount, 0);
    setTimeout(() => {
        assert.equal(callcount, 2);
    }, 4000)
}


triggeredDebounceTest();
