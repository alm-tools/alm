# Errors

Providing a great error experience is vital. Errors can exist in `tsconfig.json` files, in `ts` files and these need to be shown in the UI as well handled from different sources in the backend.

## FrontEnd
We keep a client instance of [`errorCache.ts`][errorCache.ts] syncing to error deltas from the backend.

## Backend

> You might want to read on [our async docs][async] so you know how we `cast` and what we mean by `webserver`.

The webserver contains the [`globalErrorCacheServer.ts`][globalErrorCacheServer.ts] which is again the singular source of truth.

It is just an instance of [`errorCache.ts`][errorCache.ts]

* We just pipe its updates to the clients over web sockets (as mentioned in [async][async]).
* It receives `delta` changes from other error caches e.g. the projectSeviceWorker [`tsErrorCache`][tsErrorCache.ts].

That's it!

# Diagram
`(various source) -> globalErrorCacheServer -> socketio -> globalErrorCacheClient -> (various UI elements)`

[redux]: /contributing/redux.md
[async]: /contributing/async.md
[errorCache.ts]: https://github.com/alm-tools/alm/blob/master/src/server/utils/errorsCache.ts
[globalErrorCacheServer.ts]: https://github.com/alm-tools/alm/blob/master/src/server/globalErrorCacheServer.ts
[tsErrorCache.ts]: https://github.com/alm-tools/alm/blob/master/src/server/workers/lang/cache/tsErrorsCache.ts
