/**
 * NOTE: be careful what you import in this file as it is loaded in our deploy boot as well.
 * So don't use `webpack` or `require('wepack')` etc.
 */
import path = require('path');
var nodeModulesPath = path.resolve(__dirname, 'node_modules');
var buildPath = path.resolve(__dirname, 'public', 'build');
var mainPath = path.resolve(__dirname, 'app', 'main.js');

var config = {
    // We change to normal source mapping
    devtool: 'source-map',
    entry: [mainPath],
    output: {
        path: buildPath,
        filename: 'bundle.js'
    },
    plugins: [],
    module: {
        noParse: [
            /clipboard\.min/,
        ],
        loaders: [
            {
                test: /\.json$/,
                loader: "json"
            },
            {
                test: /\.css$/,
                loader: "style!css"
            },
            {
                test: /\.less$/,
                loader: "style!css!less"
            },
            {
                test: /\.(otf|eot|png|svg|ttf|woff|woff2)(\?v=[0-9\.]*)?$/,
                loader: 'url?limit=100000'
            },
        ]
    },
    node: {
      /**
       * This is here because we couldn't find a way for webpack to
       * ignore the fs access in our languageServiceHost
       */
      fs: "empty"
    }
};

export = config;
