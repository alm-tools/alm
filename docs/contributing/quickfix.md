## QuickFix
The quickest way is to copy an existing one located in the `quickFix` directory. Copy one of these files into a new quick fix.

Quick fixes are just classes that need to implement the `QuickFix` interface.

Once you have the quickfix created just put it into the `quickfixRegistry.ts` so that the infrastructure picks it up.

**Additional Tips** : One indespensible tool when creating a quick fix is the [AST viewer](https://github.com/TypeStrong/atom-typescript#ast-visualizer) which allows you to investigate the TypeScript language service view of the file.

**New Lines**: All quick fix refactorings *must* use `\n` as the newline. We will map it to whatever is appropriate for the editor config.
