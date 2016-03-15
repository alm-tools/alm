/**
 * This file exists for initial testing
 * Basically I edit this file to see if it works 🌹
 */
declare var React: any;
import {foo} from "./foo";
let bar = foo;
// bar = '456';
// \bar < useful for search testing
/** This is test comment */
function test(a);
function test(a, b);
function test(a, b?, c?) {

}

let dom = <div>
    <img/>
</div>

class Test {
    private foo = 123;
    test() {
        return 'asdf' + `${this.foo}`;
    }
}