# Whats Here

This folder is the `Microsoft/TypeScript/src/server` / `session.ts` ported over for language service host support. This `langaugeServiceHost` can be used both on the `client` and `server` 🌹.

## Port steps:

`languageServiceHost.ts`
* Brought in `ScriptInfo` and then follow the compiler errors from there.
* Anything that used `project` was removed.
* Follow any other comments that have `BAS`

`linter.ts`
* Moved line stuff as is into `liner.ts`
