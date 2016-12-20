import * as sw from "../../utils/simpleWorker";
import * as contract from "./demoContract";
import * as cp from 'child_process';
import * as fsu from '../../utils/fsu';
import * as utils from '../../../common/utils';

const workerPrefix = `[DEMO]`;

namespace Worker {
    export const enableLiveDemo: typeof contract.worker.enableLiveDemo = (q) => {
        WorkerImplementation.enableLiveDemo(q.filePath);
        return Promise.resolve({});
    }
    export const disableLiveDemo: typeof contract.worker.disableLiveDemo = (q) => {
        WorkerImplementation.disableLiveDemo();
        return Promise.resolve({});
    }
}

// Ensure that the namespace follows the contract
const _checkTypes: typeof contract.worker = Worker;
// run worker
export const {master} = sw.runWorker({
    workerImplementation: Worker,
    masterContract: contract.master
});

const nodeModulesFolder = fsu.travelUpTheDirectoryTreeTillYouFind(__dirname, "node_modules");
const tsNodeCompilerOptions = JSON.stringify({
    /**
     * Keep getting "cannot write file" ts / ts-node errors otherwise
     */
    allowJs: false,
    /** Node's not quite there yet */
    target: 'es6',
    module: 'commonjs',

    /** Hopefully prevent a few source map bugs */
    sourceMap: true,
    inlineSources: true,
});

class FileExecutor {
    constructor(filePath: string, private cb: (data: string) => void) {
        /** Find key paths */
        const tsNodePath = `${nodeModulesFolder}/ts-node/dist/bin.js`;

        /** In this dir */
        const cwd = utils.getDirectory(filePath);

        /** With these compiler options */
        const TS_NODE_COMPILER_OPTIONS = tsNodeCompilerOptions;

        /** Execute this */
        const toExec
            = [
                tsNodePath,
                filePath,
            ];

        const child = cp.spawn(process.execPath, toExec, {
            cwd,
            env: {
                TS_NODE_COMPILER_OPTIONS,
                /**
                 * Disable cache just because
                 */
                TS_NODE_CACHE: false,
                /**
                 * disableWarnings as we don't want it to prevent us from running the js
                 */
                TS_NODE_DISABLE_WARNINGS: true,
            }
        });

        child.stdout.on('data', (data) => {
            if (this.disposed) return;
            cb(data.toString());
        });

        child.stderr.on('data', (data) => {
            if (this.disposed) return;
            cb(data.toString());
        });

        child.on('close', (code) => {
            if (this.disposed) return;
            console.log(workerPrefix, 'process ended');
        });
    }
    disposed = false;
    dispose() {
        this.disposed = true;
    }
}

namespace WorkerImplementation {
    let executor: FileExecutor | undefined;
    export const enableLiveDemo = (filePath: string) => {
        console.log(workerPrefix, `Started on filePath: ${filePath}`);
        if (executor) {
            executor.dispose();
        }
        master.receiveClearLiveDemo({});
        executor = new FileExecutor(filePath, (data) => {
            master.receiveLiveDemoData({ data });
        });
    }
    export const disableLiveDemo = () => {
        if (executor) {
            master.receiveClearLiveDemo({});
            executor.dispose();
            executor = undefined;
        }
    }
}
