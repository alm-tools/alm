/**
 * @module wraps webpack in a nice api
 */
import * as webpack from 'webpack';
import * as fs from 'fs';

/**
 * Creates a webpack bundle
 */
export function bundle(args: {
    entryPointName: string,
    outputFileName: string,
    prod: boolean
}) {
    return new Promise((res, rej) => {

        if (!fs.existsSync(args.entryPointName)) {
            /** Webpack ignores this siliently sadly so we need to catch it ourselves */
            const error = `Entry point does not exist: ${args.entryPointName}`;
            console.error(error);
            rej(new Error(error));
        }

        const config = {
            devtool: 'source-map',
            entry: args.entryPointName,
            output: {
                filename: args.outputFileName
            },
            alias: {
                'alm': __dirname + '/../client/alm.ts',
            },
            resolve: {
                extensions: ['', '.ts', '.tsx', '.js']
            },
            module: {
                loaders: [
                    { test: /\.tsx?$/, loader: 'ts-loader' }
                ]
            },
            /** minify */
            plugins: args.prod ? [
                new webpack.DefinePlugin({
                    'process.env': {
                        NODE_ENV: "'production'",
                    },
                }),
                new webpack.optimize.UglifyJsPlugin(),
            ] : [],
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
                compilerOptions: {
                    "jsx": "react",
                    "target": "es5",
                    "moduleResolution": "node",
                    "experimentalDecorators": true,
                    "lib": [
                        "es6",
                        "dom"
                    ]
                }
            }
        };

        const compiler = webpack(config);
        compiler.run(function(err, stats) {
            if (err) {
                console.error("BUNDLING FAILED:", args);
                console.error(err);
                rej(err);
                return;
            }
            res();
        });
    });
}

const {entryPointName, outputFileName, prod} = JSON.parse(process.argv[2]);
bundle({ entryPointName, outputFileName, prod: prod === 'true' ? true : false });
