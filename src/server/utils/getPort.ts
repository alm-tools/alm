/**
 * Based of https://gist.github.com/mikeal/1840641
 * But modified to support from a particular port
 */

import * as net from 'net';

let portrange = 4444;
// let dispose = () => null;
export function startPortSearch(startPort: number, cb: (port: number) => void) {
    portrange = startPort;

//     const tryNextPort = (e) => {
//         console.log(e);
//         getPort(cb);
//     }
//     process.on('uncaughtException', tryNextPort);
//     dispose = () => process.removeListener('uncaughtException', tryNextPort);

    getPort(cb);

}

function getPort(cb) {
    var port = portrange;
    portrange += 1;


    var server = net.createServer();

    server.on('error', function(err) {
        getPort(cb);
    });
    server.listen(port, function(err) {
        // Found one!
        server.once('close', function() {
            cb(port);
        });
        server.close();
    });
}
