import {triggeredDebounce} from "../common/utils";
import * as assert from "assert";

describe('triggeredDebounce', function() {
    this.timeout(3000);

    it('general', (done) => {
        let callcount = 0;
        const foo = triggeredDebounce({
            func: (x: string) => {
                callcount++;
            },
            mustcall: (n, o) => n !== o,
            milliseconds: 100
        });

        // All of these get debounced and we only call on last
        foo('1');
        foo('1');
        foo('1');

        // This is a call made later on and should not be debounced
        setTimeout(() => foo('1'), 200);

        // All of these calls are with different strings so should all make it through
        setTimeout(() => foo('2'), 300);
        setTimeout(() => foo('3'), 300);
        setTimeout(() => foo('4'), 300);

        // Assertions
        assert.equal(callcount, 0);
        setTimeout(() => {
            assert.equal(callcount, 5);
            done();
        }, 2000)
    });
});
