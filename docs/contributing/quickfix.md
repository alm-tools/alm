## QuickFix
The quickest way is to copy an existing one located in the [quick fix directory](https://github.com/TypeStrong/atom-typescript/tree/a91f7e0c935ed2bdc2c642350af50a7a5aed70ad/lib/main/lang/fixmyts/quickFixes). Copy one of these files into a new quick fix.

Quick fixes need to implement the `QuickFix` interface ([code here](https://github.com/TypeStrong/atom-typescript/blob/a91f7e0c935ed2bdc2c642350af50a7a5aed70ad/lib/main/lang/fixmyts/quickFix.ts#L46-L53)).

Once you have the quickfix created just put it into the [quickfix registry](https://github.com/TypeStrong/atom-typescript/blob/a91f7e0c935ed2bdc2c642350af50a7a5aed70ad/lib/main/lang/fixmyts/quickFixRegistry.ts#L14-L24) so that the infrastructure picks it up.

**Additional Tips** : One indespensible tool when creating a quick fix is the [AST viewer](https://github.com/TypeStrong/atom-typescript#ast-visualizer) which allows you to investigate the TypeScript language service view of the file.

**New Lines**: All quick fix refactorings *must* use `\n` as the newline. We will map it to whatever is appropriate for the editor config.
