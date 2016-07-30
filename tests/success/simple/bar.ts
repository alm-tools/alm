/** An intentionally global variable */
const bar = 123;
/** An intentionally global `function` */
function barFunc() {

}

interface BarInterface {
  new (bar: string): BarInterface;
  barInterfaceMember: string;
  barInterfaceMethod(): string;
  barInterfaceMethodGeneric<T>(a: T): T;
}
interface BarInterFaceWithSignature<T> {
  [key: string]: T;
}

enum BarEnum {
  BarEnumMember
}

class BarGlobalClass {
  constructor() {

  }
  private static aPrivateStaticMember: string;
  globalClassMember: string;
  private aPrivateClassMember: string;
  [key: string]: string;
}

class BarGlobalClassExtension extends BarGlobalClass {
  anotherMember: string;
}

namespace Foo.Bar.Bas {
  export class InNameSapce{
    public someMember;
  }
  export class InNameSpaceInheritance extends BarGlobalClass {
    public someOtherMember: string;
  }
}
