# TypeScript Emit Support

## Incremental Build

> The fastest incremental update possible

As soon as you open or edit a TypeScript file we do an intelligent emit of the expected JavaScript.

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/emit.gif)

> Note: You can disable this using `tsconfig.json` [`compileOnSave`][tsconfig-compile-on-save]

## Build

**build** command `F6` to do a full emit + emit check.

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/build.gif)

## View Live Output JavaScript

`Ctrl|⌘ + Shift + M` toggles the output co**m**piled JS file for a give TypeScript file.

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/emitToggle.png)

[tsconfig-compile-on-save]:/config/tsconfig.md#compileonsave

## Compile and send JavaScript to the console

`Ctrl|⌘ + M` compiles the selected TypeScript, transpiles it to JavaScript and then sends it to the browser (chrome) console.

> Can be used even if `compileOnSave` is false ;)
