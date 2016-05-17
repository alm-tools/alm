# About this folder
This the backend to generate the live documentation for a TypeScript project.

## Basic overview

We start at each source file.
* If its a module we create a new module entry.
* If not we add its stuff to the `global` module entry.

There are different transformers: Stuff that takes a TypeScript AST `Node` and gives you `DocumentedType`. We just start at a source file and only visit the stuff we consider important for documentation purposes 🌹
