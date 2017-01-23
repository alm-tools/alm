import * as sw from "../../../../utils/simpleWorker";
import * as contract from "./bundlerContract";
import * as fs from "fs";
import * as webpack from 'webpack';

namespace Worker {
    export const start: typeof contract.worker.start = async (q) => {
        startLiveBundling(q);
        return {};
    }
}

// Ensure that the namespace follows the contract
const _checkTypes: typeof contract.worker = Worker;
// run worker
export const { master } = sw.runWorker({
    workerImplementation: Worker,
    masterContract: contract.master
});

let lastAttempt: {
    entryFilePath?: string,
    compiler?: webpack.compiler.Compiler
} = {};


const compilerOptions = {
    "jsx": "react",
    "target": "es5",
    "moduleResolution": "node",
    "experimentalDecorators": true,
    "lib": [
        "es6",
        "dom"
    ]
};

/**
 * Creates a webpack bundle
 */
export function startLiveBundling(args: {
    entryFilePath: string,
    outputDirPath: string,
}) {

    const runCallback = function(err, stats) {
        if (err) {
            console.error("BUNDLING FAILED:", args);
            console.error(err);
            master.bundleStatus({ type: 'error', error: JSON.stringify(err) });
            return;
        }
        master.bundleStatus({ type: 'success' });
        return;
    };

    if (lastAttempt.entryFilePath === args.entryFilePath) {
        master.bundleStatus({ type: 'bundling' });
        lastAttempt.compiler.run(runCallback);
        return;
    }

    if (!fs.existsSync(args.entryFilePath)) {
        /** Webpack ignores this siliently sadly so we need to catch it ourselves */
        const error = `Entry point does not exist: ${args.entryFilePath}`;
        console.error(error);
        master.bundleStatus({ type: 'error', error: error });
        return;
    }

    const config = {
        devtool: 'source-map',
        entry: {
            alm: __dirname + '/../client/alm.ts',
            index: args.entryFilePath,
        },
        output: {
            filename: `${args.outputDirPath}/[name].js`
        },
        resolve: {
            extensions: ['', '.ts', '.tsx', '.js'],
        },
        module: {
            loaders: [
                { test: /\.tsx?$/, loader: 'ts-loader' }
            ]
        },
        cache: false,
        /** Decrease noise */
        stats: {
            hash: false, version: false, timings: false, assets: false,
            chunks: false, modules: false, reasons: false, children: false,
            source: false, publicPath: false, warnings: true,
            /** Errors only */
            errors: true,
            errorDetails: true,
        },
        /**
         * Custom compiler options for demo building.
         * Effectively what would be in each app tsconfig.json
         **/
        ts: {
            compilerOptions
        }
    };

    const compiler = webpack(config);
    master.bundleStatus({ type: 'bundling' });
    compiler.run(runCallback);

    lastAttempt = {
        compiler,
        entryFilePath: args.entryFilePath
    }
}
