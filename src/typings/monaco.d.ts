/// <reference path="../../node_modules/monaco/build/monaco.d.ts"/>

/**
 * This is setup in our `index.html`. This just points to `require` function in monaco's loader
 * Named differently so it doesn't crash and burn our webpack workflow.
 * You can use it to load modules in sync because they are all already loaded internally when `editor.main` is loaded
 */
declare var monacoRequire: (moduleId: string) => any;

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
