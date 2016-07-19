/**
 * Based of https://gist.github.com/mikeal/1840641
 * But modified to support searching from a particular port
 * Also the original did not actually work.
 */

import * as http from 'http';

export class GetPort {
    // The next port we will try
    portrange = 4444;
    startPortSearch = (startPort: number, cb: (port: number) => void) => {
        this.portrange = startPort;
        this.getPort(cb);
    }
    private getPort = (cb) => {
        var port = this.portrange;
        this.portrange += 1;

        var server = http.createServer(() => null);

        server.on('error', (err) => {
            this.getPort(cb);
        });
        server.listen(port, '0.0.0.0', (err) => {
            // Found one!
            server.once('close', () => {
                cb(port);
            });
            server.close();
        });
    }
}
