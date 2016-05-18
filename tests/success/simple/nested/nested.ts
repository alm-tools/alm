/**
 * A nested module test
 */
export const nested = 123;

namespace Foo.Bar {
  function fooBarFunction() {

  }
}

/** Some comments */
function aRootLevelFunction() {

}

function functionWithGenerics<T>(a: T): T {
  return a;
}

enum EnumSample {
  /** Sample comment */
  EnumMemberSample,
}