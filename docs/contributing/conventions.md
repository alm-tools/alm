# File paths
* `fileName`: just the file name e.g `foo.ts`
* `filePath`: Full path e.g. `c:/dev/foo.ts`
* `relativeFilePath`: relative to project e.g.`dev/foo.ts`

Note: Within the `ts` compiler source `fileName` is actually `filePath`

# File contents
* `contents` : The string `string` content of a file.
* `text` : The `string:[]` contents split by a newline.

# Events
* If there is a user command that will subsequently cause another command use `do`/`did` e.g. `doOpenFile` and `didOpenFile`

# Stream
* If there is something that we care about initially as well as updates use `foo`/`fooUpdated` e.g. `fileList`/`fileListUpdated`

# `line` , `ch`
Always `0` based, unless explicitly marked to be different.

# Dependency
Workers and worker-like state modules (file listing, active project) do not explicitly depend on the *socketServer*. Instead they provide an `event` that the socket can pipe to `cast`. Reason, preventing cycles : these modules generally provide a function called from sockets as well (socket -> module) and therefore module using socket will create a cycle.

# UI / DTO / Disk
Sometimes we have version of the same data between the UI / backend. For this we have:
* UI : used in user interface
* DTO : used in data transfer
* Disk : Used to persist to Disk
