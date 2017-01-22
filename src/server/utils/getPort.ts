/**
 * Based of https://gist.github.com/mikeal/1840641
 * But modified to support searching from a particular port
 * Also the original did not actually work.
 */

import * as http from 'http';

export const getPort = (startPort: number = 4444): Promise<number> => {
    const tryGetPort = (cb: (num: number) => void) => {
        var port = startPort;
        startPort += 1;

        var server = http.createServer(() => null);

        server.on('error', (err) => {
            tryGetPort(cb);
        });
        server.listen(port, '0.0.0.0', (err) => {
            // Found one!
            server.once('close', () => {
                cb(port);
            });
            server.close();
        });
    }

    let resolve: (num: number) => void;
    const prom = new Promise<number>(res => resolve = res);
    tryGetPort(resolve);
    return prom;
};
