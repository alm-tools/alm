# Document Handling
A code editor edits files. I'm calling the data representation of these files in the *browser client* as *model*.

A Code Editor instance ([codeEditor.ts][codeEditor.ts]) asks the [docCache.ts][docCache.ts] for document by filePath. The docCache load the file from the server, converts them to a *model*, and passes it to the Editor instance.


## Linked docs
We actually create a root doc for a given filePath *only once* and all CM instances (e.g. in tabs / references) pointing to the same path get a linked version of the same doc. This gives us unified history / change tracking by filePath.

## Keeping the file up to date with server changes
The doc cache sends any edits to the root document to the server.
The doc cache also subscribes to server edits / file save changes and updates the rootDoc.

## OriginId
The docCache makes sure that edits that were created locally aren't applied by adding an `originId` to code edits. `originId` is unique by each browser window. If the server sends us an edit with the same `originId` it means we did that edit and we do just ignore it. Other edits sent by the server is mapped to `came-from-network` `sourceId` before making the edit to the local root doc so that when the `change` fires on the doc we just ignore it (as all relevant syncing is complete). The following demonstrates a multi-monitor/multi-browser-window demo working just fine.


![multimonitor](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/multiMonitor.gif)

## Syntax Highlighting
For the purpose of TypeScript Syntax Highlighting the docCache also keeps the document up to date in the `classifierCache` ([classifierCache.ts][classifierCache.ts]) by sending it edits. [More on Syntax Highlighting][syntax].

[docCache.ts]:https://github.com/alm-tools/alm/blob/master/src/app/monaco/model/docCache.ts
[codeEditor.ts]:https://github.com/alm-tools/alm/blob/master/src/app/monaco/editor/codeEditor.tsx
[classifierCache.ts]:https://github.com/alm-tools/alm/blob/master/src/app/monaco/model/classifierCache.ts
[syntax]: ./syntax.md
