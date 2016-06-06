/// <reference path="../../node_modules/monaco-editor-core/monaco.d.ts"/>

/** This is setup in our `index.html`. This just points to `require` function in monaco's loader (so it doesn't crash and burn our webpack workflow) */
declare var monacoRequire: <T>(moduleId: [string], callback: (module: T) => void) => void;

/** Makes bringing monaco code in easier */
interface IDisposable {
    dispose();
}

declare module monaco {
    module editor {
        interface ICommonCodeEditor {
            // This function does exist but isn't documented
            changeDecorations;
        }
        interface IModelDecorationsChangeAccessor {
            changeDecorationOptions;
        }
        interface ITextModel {
            /**
             * Get a range covering the editable range
             */
            getEditableRange(): Range;
        }
    }
}
