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
            /ntypescript/,
        ],
        loaders: [
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
      fs: "empty"
    }
};

export = config;
