/**
 * This file exists for initial testing
 * Basically I edit this file to see if it works 🌹
 */
/** declare React */
declare var React: any;
/** Imports */
import {foo, Foo} from "./foo";
let bar = foo;
// bar = '456';
// \bar < useful for search testing
/** This is test comment */
function test(x);
function test(x, y);
function test(x, y?, z?) {
}

let dom = <div>
    <img/>
</div>

class Test {
    private foo = 123;
    /** Some constructor comment */
    constructor() {

    }
    test() {
        return 'asdf' + `${this.foo}`;
    }
    /** Some comment for the generic method */
    aGenericMethod<T>(a: T): T {
        return a;
    }
}

class GenericTest<T> {
    someProperty: T;
}

const Comp = (props: { text: string }) => {
    return <div>{props.text}</div>
}
const comp = <Comp text="hello world"/>

export class Bas extends Foo {
    someMethod() {

    }
}

let jsonToDtsTesting = `
{
  foo: 123,
  bar: {
    bas: "Hello",
    baz: {
      qux: "World"
    }
  }
}
`;
