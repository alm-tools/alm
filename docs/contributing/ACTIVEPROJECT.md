# Active Project
When the user launches `alm` in a folder the active project is activated by `session.ts` (called from `activeProject`).

## Watching
### Tsconfig.json
If there is a tsconfig.json associated with the activeProject, we watch it. If it changes we reload all our information about the project. If it contains parse errors we send them through to all connected clients.
