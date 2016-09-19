# File Listing Worker

[File listing worker][fileListingWorker] is one of the first ones we wrote and continues to be the simplest.

## Flow
On working directory getting set the master just calls `setupWatch`.

* This goes ahead and uses `glob` to glob the whole directory.
* Sets up a watcher (using `chokidar`) on this directory to detect any changes

Whenever anything changes it send `fileListingDelta` to the master (which is also the web server process). That goes ahead and sends it to any connected clients (using our `cast`) mechanism.


[fileListingWorker]: https://github.com/alm-tools/alm/blob/master/src/server/workers/fileListing/fileListingWorker.ts
