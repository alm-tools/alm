# File paths
* `fileName`: just the file name e.g `foo.ts`
* `filePath`: Full path e.g. `c:/dev/foo.ts`
* `relativeFilePath`: relative to project e.g.`dev/foo.ts`

# File contents
* `contents` : The string `string` content of a file.
* `text` : The `string:[]` contents split by a newline. This is the model followed by codemirror as well.

# Events
* If there is a user command that will subsequently cause another command use `do`/`did` e.g. `doOpenFile` and `didOpenFile`

# Stream
* If there is something that we care about initially as well as updates use `foo`/`fooUpdated` e.g. `fileList`/`fileListUpdated`
