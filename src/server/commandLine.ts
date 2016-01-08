import minimist = require('minimist');
import * as path from "path";
import * as utils from "../common/utils";
import * as workingDir from "./disk/workingDir";
import * as fsu from "./utils/fsu";

let defaultPort = process.env.PORT /* the port by Windows azure */
    || 4444;

var argv: {
    p?: number;
    d?: string;
    o?: boolean;
    c?: string;
    safe?: boolean;
    _?: string[];
} = minimist(process.argv.slice(2),{
    string: ['dir','config'],
    boolean: ['open','safe'],
    alias: {
        'p': 'port',
        'd': 'dir',
        'o': 'open',
        'c': 'config',
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
    config: string;
    open: boolean;
    safe: boolean;
    filePaths: string[];
}
export let getOptions = utils.once((): CommandLineOptions => {
    let options: CommandLineOptions = {
        port: argv.p,
        dir: argv.d,
        open: argv.o,
        safe: argv.safe,
        config: argv.c,
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
    // Common usage user does `alm ./srcFolder`
    // So if there was only one filePath detected and its a dir ... user probably meant `-d`
    if (options.filePaths.length == 1) {
        let filePath = workingDir.makeAbsoluteIfNeeded(options.filePaths[0]);
        if (fsu.isDir(filePath)) {
            workingDir.setProjectRoot(filePath);
            options.filePaths = [];
        }
    }

    if (options.safe) {
        console.log("---SAFE MODE---")
    }

    if (options.config) {
        options.config = workingDir.makeAbsoluteIfNeeded(argv.c);
        if (!options.config.endsWith('.json')) {
            options.config = options.config + '/' + 'tsconfig.json';
        }
        console.log("TSCONFIG: ", options.config);
    }

    return options;
});
