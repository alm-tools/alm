import minimist = require('minimist');
import * as path from "path";

let defaultPort = 4444;

var argv: {
    p?: number;
    d?: string;
    o?: boolean;
    _?: string[];
} = minimist(process.argv.slice(2),{
    string: ['dir'],
    boolean: ['open'],
    alias: {
        'p': 'port',
        'd': 'dir',
        'o': 'open',
    },
    default : {
        p: defaultPort,
        d: process.cwd(),
        o: true
    }
});

interface CommandLineOptions {
    port: number;
    dir: string;
    open: boolean;
}
export function getOptions(): CommandLineOptions {
    let options = {
        port: argv.p,
        dir: argv.d,
        open: argv.o,
    }
    if (typeof options.port !== 'number') {
        options.port = defaultPort;
    }
    if (argv.d){
        if (path.isAbsolute(argv.d)){
            options.dir = argv.d;
        } else {
            options.dir = path.resolve(process.cwd(), argv.d);
        }
    }
    if (argv._ && argv._.length){
        console.log('Additinal arguments beyond p/d/o not supported')
    }

    return options;
}
