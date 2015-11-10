# What here

This folder is the MS/TypeScript/src/server ported over for a client side language service host support

Port steps:

* brought in `ScriptInfo` and then follow the compiler errors from there.
* Anything that used `project` was removed
* moved line stuff as is into liner.ts
