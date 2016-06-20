/**
 * Based of https://gist.github.com/mikeal/1840641
 * But modified to support searching from a particular port
 * Also the original did not actually work.
 */

import * as http from 'http';

// The next port we will try
let portrange = 4444;

export function startPortSearch(startPort: number, cb: (port: number) => void) {
    portrange = startPort;
    getPort(cb);
}

function getPort(cb) {
    var port = portrange;
    portrange += 1;

    var server = http.createServer(() => null);

    server.on('error', function(err) {
        getPort(cb);
    });
    server.listen(port, '0.0.0.0', function(err) {
        // Found one!
        server.once('close', function() {
            cb(port);
        });
        server.close();
    });
}
