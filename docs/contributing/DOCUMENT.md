# Document Handling
A code editor edits files. I'm calling the data representation of these files in the *browser client* as *documents* ([this is what these are called in CodeMirror][document]).

A Code Editor instance ([codeEditor.ts][codeEditor.ts]) asks the [docCache.ts][docCache.ts] for document by filePath. The docCache load the file from the server, converts them to a CodeMirror *document*, and passes it to the CodeMirror Editor instance.

We only load a filePath (and convert it to a document) *once* irrespective of how many views we have on the file (tabs, file references etc.). This gives us unified history / change tracking by filePath.

## Keeping the file up to date
The doc cache sends any edits to the document to the server.

The doc cache also subscribes to server edits.

## OriginId
The docCache makes sure that edits that were created by itself aren't applied by adding an `originId` to code edits. `originId` is unique by each document in a browser window. This is okay because *documents are unique by filePath* in a browser window.

## Syntax Highlighting
For the purpose of TypeScript Syntax Highlighting the docCache also keeps the document up to date in the `classifierCache` ([classifierCache.ts][classifierCache.ts]) by sending it edits. [More on Syntax Highlighting][syntax].

[document]:https://codemirror.net/doc/manual.html#Doc
[docCache.ts]:https://github.com/alm-tools/alm/blob/master/src/app/codemirror/mode/docCache.ts
[codeEditor.ts]:https://github.com/alm-tools/alm/blob/master/src/app/codemirror/codeEditor.tsx
[classifierCache.ts]:https://github.com/alm-tools/alm/blob/master/src/app/codemirror/mode/classifierCache.ts
[syntax]: ./SYNTAX.md
