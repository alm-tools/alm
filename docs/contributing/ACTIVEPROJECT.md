# Active Project
When the user launches tsb in a folder, in decreasing priority:
* we check for `tsb.json` and if its valid and if it contains at least one project definition. If so, its the activeProject.
* we check for `tsconfig.json` files and select the one at the highest level possible. Its the activeProject (name: directoryname)
* we create an in memory project. Its the activeProject (name: '__auto__')

## Watching
### TSB
Watch for `tsb.json` changes. If it changes, we do nothing special, send parse error or, just send the updated list to the client.
### Tsconfig.json
If there is a tsconfig.json associated with the activeProject, we watch it. If it changes we reload all our information about the project. If it contains parse errors we send them through.
