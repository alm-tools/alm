# TSConfig Handling

> Note : you need knowledge of the different [process boundaries in the code base][process].

We have `activeProjectConfig.ts` and `activeProject.ts`.

## ActiveProjectConfig

* This is used in the main web process. It makes sure the `tsconfig.json` is valid and if so sets is as the active config.
* If invalid it reports the errors.
* Watches tsconfig.json. If changed checks if valid / invalid. If valid sets active config again.

The main web process uses `projectDataLoader` to load the information based on the active config event and sends it down to the project service worker

## ActiveProject

This is used in the project service worker. It gets data passed down from the main process worker and creates a `project`. This `project` is what is used as our main handle to the TypeScript langauge service.


[process]: (/contributing/async.md)
