/**
 * Dev time server for front-end
 */
import path = require('path');
import fs = require('fs');
import express = require('express');
import {cookies} from "./cookies";

var config = require('../webpack.config.js');

export const webpackPort = 8888;
export const devtimeDetectionFile = __dirname + '/devtime.txt';

function bundle() {
    var Webpack = require('webpack');
    var WebpackDevServer = require('webpack-dev-server');

    /**
     * Update the prod config for dev time ease
     */
    var devConfig = Object.create(config);
    // Makes sure errors in console map to the correct file and line number
    devConfig.devtool = 'eval';
    devConfig.entry = [        
    // For hot style updates
        'webpack/hot/dev-server',
        // The script refreshing the browser on hot updates
        `webpack-dev-server/client?http://localhost:${webpackPort}`,
        // Also keep existing
    ].concat(config.entry);
    
    // We have to manually add the Hot Replacement plugin when running
    devConfig.plugins = [new Webpack.HotModuleReplacementPlugin()];    
    /** End changes of prod config */

    // First we fire up Webpack an pass in the configuration we
    // created
    let bundleStart: number;
    let compiler = Webpack(devConfig);

    // We give notice in the terminal when it starts bundling and
    // set the time it started
    compiler.plugin('compile', function() {
        console.log('Bundling...');
        bundleStart = Date.now();
    });

    // We also give notice when it is done compiling, including the
    // time it took. Nice to have
    compiler.plugin('done', function(result) {
        console.log('Bundled in ' + (Date.now() - bundleStart) + 'ms!');
    });

    var bundler = new WebpackDevServer(compiler, {

        // We need to tell Webpack to serve our bundled application
        // from the build path. When proxying
        publicPath: '/build/',

        // Configure hot replacement
        hot: true,

        // The rest is terminal configurations
        quiet: false,
        noInfo: true,
        stats: {
            colors: true
        }
    });

    // We fire up the development server and give notice in the terminal
    // that we are starting the initial bundle
    bundler.listen(webpackPort, 'localhost', function() {
        console.log('Bundling project, please wait...');
    });
};

function rebundleDeploy() {
    // build
    var Webpack = require('webpack');
    let compiler = Webpack(config);
    compiler.run((err, stats) => {
        if (err) {
            console.error('Failed to refresh bundle', err);
        }
        else {
            console.log('Refreshed bundle');
        }
    });
}

export function setup(app: express.Express) {

    var outFile = path.join(config.output.path, config.output.filename);
    if (!fs.existsSync(outFile)) {
        rebundleDeploy();
    }

    // Either immediately. Or only if needed
    var _proxy;
    function startProxyAndBundleIfNeeded() {
        if (_proxy) return;

        var httpProxy = require('http-proxy');
        _proxy = httpProxy.createProxyServer();
        bundle();
    }

    var devTime = fs.existsSync(devtimeDetectionFile);
    if (devTime) {
        // Start immediately
        startProxyAndBundleIfNeeded();
    }

    // Proxy handling
    app.all('/build/*', function(req, res, next) {
        if (devTime) {
            startProxyAndBundleIfNeeded();
            _proxy.web(req, res, {
                target: `http://localhost:${webpackPort}`
            });
        }
        else {
            next();
        }
    });

    function addDevHeaders(res: express.Response) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }

    // Dev time no caching
    app.use('/', function(req, res, next) {
        if (devTime) {
            addDevHeaders(res);
        }
        next();
    });

    app.use('/dev', (req, res, next) => {
        addDevHeaders(res);
        devTime = true;
        fs.writeFileSync(devtimeDetectionFile, 'If this file exists the server will start in dev mode');
        res.send('Hot Reload setup!')
    });

    app.use('/prod', (req, res, next) => {
        rebundleDeploy();
        addDevHeaders(res);
        if (devTime) {
            devTime = false;
            fs.unlinkSync(devtimeDetectionFile);
        }
        res.send('Using static bundled files')
    });
}