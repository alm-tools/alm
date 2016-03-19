# Syntax Highlighting
The TypeScript language service has a few functions for syntax highlighting. Here they are in increasing *order of complexity* :

* `getLexicalClassifications`: Uses a trimmed down version of the always correct TypeScript scanner. Trim in the sense that it goes line by line, and for each line it returns a state, from this state the next line can be classified. However the state value is just a pure enum, (not a stack) so it cannot be 100% reliable. E.g. https://github.com/Microsoft/TypeScript/issues/5545
* `getSyntacticClassifications`: Uses the full TypeScript scanner. However in order to use the full scanner you need to give it a file path + file contents. Also these file contents need to be kept up to date. This can be done using a `LanguageServiceHost` that supports `ScriptInfo` (a class that provides super fast change tracking + versioning).
* `getSemanticClassifications`: Use the full TypeScript *program*. This provides *semantic* meanings to stuff e.g. is this variable actually a `class` as well. Doing semantic classifications is a slow process as cannot be done efficiently without degrading user interaction. So this is done in the background. Only IDE is know that does it is the full Visual Studio.

## Which one to use
`getLexicalClassifications` is insufficient for *accurate* colorization for stuff like *ES6 template strings* or *JSX/TSX*.

`getSemanticClassifications` is too slow to do in the UI thread.

**`getSyntacticClassifications` is the function that provides a nice middle ground**. So now we need to figure out a way to have a language service in the UI thread that provides efficient real-time editing of files and then query this language service from CodeMirror ([the editor we use](./CODEMIRROR.md)).

## Classifier Cache
The file `classifierCache.ts` in our codebase provides a hot language service that is maintained and kept up to sync by `docCache.ts` (more on `docCache` later). This cache / language service can then be queried for tokens from the language mode.

## Language Mode
This is a CodeMirror concept. CodeMirror editors work on a *mode*, [check the docs](http://codemirror.net/doc/manual.html#modeapi). We have a `typescriptMode.ts` that just follows the CodeMirror mode API. This maintains its knowledge about the *position* and the *filePath* that is being rendered by  CodeMirror and just queries the tokens for this line from the `classifierCache`. Additionally based on the contents of the line being tokenized it provides  high level *semantic* classifications using heuristics (e.g. if a variable is after `:` and `CamelCased` its probably a type).
