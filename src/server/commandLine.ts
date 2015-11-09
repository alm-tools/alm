import minimist = require('minimist');
import * as path from "path";
import * as utils from "../common/utils";
import * as workingDir from "./disk/workingDir";

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
    filePaths: string[];
}
export let getOptions = utils.once((): CommandLineOptions => {
    let options: CommandLineOptions = {
        port: argv.p,
        dir: argv.d,
        open: argv.o,
        filePaths: [],
    }
    if (typeof options.port !== 'number') {
        options.port = defaultPort;
    }
    if (argv.d) {
        options.dir = workingDir.makeAbsoluteIfNeeded(argv.d);
        workingDir.setProjectRoot(options.dir);
    }
    if (argv._ && argv._.length) {
        options.filePaths = argv._.map(x=> workingDir.makeAbsoluteIfNeeded(x));
    }

    return options;
});
