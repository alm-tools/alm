import minimist = require('minimist');
import * as path from "path";
import * as utils from "../common/utils";
import * as workingDir from "./disk/workingDir";
import * as fsu from "./utils/fsu";

let defaultPort = process.env.PORT /* the port by Windows azure */
    || 4444;

var argv: {
    t?: number;
    d?: string;
    o?: boolean;
    p?: string;
    safe?: boolean;
    i?: boolean;
    _?: string[];
} = minimist(process.argv.slice(2), {
    string: ['dir', 'config'],
    boolean: ['open', 'safe', 'init'],
    alias: {
        't': 'port',
        'd': 'dir',
        'o': 'open',
        'p': 'project',
        'i': 'init'
    },
    default: {
        t: defaultPort,
        d: process.cwd(),
        o: true
    }
});

interface CommandLineOptions {
    port: number;
    dir: string;
    project: string;
    open: boolean;
    safe: boolean;
    init: boolean;
    filePaths: string[];
}
export let getOptions = utils.once((): CommandLineOptions => {
    let options: CommandLineOptions = {
        port: argv.t,
        dir: argv.d,
        open: argv.o,
        safe: argv.safe,
        project: argv.p,
        init: argv.i,
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
        options.filePaths = argv._.map(x => workingDir.makeAbsoluteIfNeeded(x));
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
        console.log('---SAFE MODE---');
    }

    if (options.init && options.project) {
        console.log('The project option is ignored if you specific init. The initialized file *is* the project.');
    }

    if (options.project) {
        options.project = workingDir.makeAbsoluteIfNeeded(options.project);
        if (!options.project.endsWith('.json')) {
            options.project = options.project + '/' + 'tsconfig.json';
        }
        console.log('TSCONFIG: ', options.project);
    }

    return options;
});
