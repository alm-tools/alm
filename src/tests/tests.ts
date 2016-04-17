import {triggeredDebounce} from "../common/utils";
import * as assert from "assert";

describe('triggeredDebounce', function() {
    this.timeout(5000);

    it('general', (done) => {
        let callcount = 0;
        const foo = triggeredDebounce({
            func: (x: string) => {
                console.log('called: ', x);
                callcount++;
            },
            mustcall: (n, o) => o && n !== o,
            milliseconds: 100
        });

        foo('1');
        foo('1');
        foo('1');
        setTimeout(() => foo('1'), 200);

        assert.equal(callcount, 0);
        setTimeout(() => {
            assert.equal(callcount, 2);
            done();
        }, 4000)
    });
});
