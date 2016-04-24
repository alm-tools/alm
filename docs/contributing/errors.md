# Errors

Providing a great error experience is vital. Errors can exist in `tsconfig.json` files, in `ts` files and these need to be shown in the UI as well handled from different sources in the backend.

## FrontEnd
[Redux makes this easy][redux]. We have a single `errorsByFilePath` in our state that is the *only* version of truth in the FrontEnd.

This is the state that is used by the status bar, the main panel and our CodeMirror [`linter` plugin][linter].

## Backend

> You might want to read on [our async docs][async] so you know how we `cast` and what we mean by `webserver`.

The webserver contains the [`globalErrorCache.ts`][globalErrorCache.ts] which is again the singular source of truth.

It is just an instance of [`errorCache.ts`][errorCache.ts]

* We just pipe its updates to the clients over web sockets (as mentioned in [async][async]).
* It receives `delta` changes from other error caches e.g. the projectSeviceWorker [`tsErrorCache`][tsErrorCache.ts].

That's it!

# Diagram
`(various source) -> globalErrorCache -> frontEnd Redux State -> (various UI elements)`

[redux]: /contributing/redux.md
[linter]: https://github.com/alm-tools/alm/blob/master/src/app/codemirror/addons/linter.ts
[async]: /contributing/async.md
[errorCache.ts]: https://github.com/alm-tools/alm/blob/master/src/server/utils/errorsCache.ts
[globalErrorCache.ts]: https://github.com/alm-tools/alm/blob/master/src/server/globalErrorCache.ts
[tsErrorCache.ts]: https://github.com/alm-tools/alm/blob/master/src/server/workers/lang/cache/tsErrorsCache.ts
