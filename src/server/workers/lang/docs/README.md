# About this folder
This the backend to generate the live documentation for a TypeScript project.

## Basic overview

We start at each source file.
* If its a module we create a new module entry.
* If not we add its stuff to the `global` module entry.

There are different transformers: Stuff that takes a TypeScript AST `Node` and gives you `DocumentedType`. We just start at a source file and only visit the stuff we consider important for documentation purposes 🌹

## Helper functions from ts
There are quite a few helper functions in the TypeScript compiler. I have found exploring `getQuickInfo` and `getNavigateToItems` in `services.ts` to be amongst the best places to look for *that magic function*.
