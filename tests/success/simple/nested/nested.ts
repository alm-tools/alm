/**
 * A nested module test
 */
/** sample comment for nested varaible */
export const nestedVariable = 123;

/** A comment for a module */
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