/**
 * Dev time server for front-end
 */
import config = require('../webpack.config');

import path = require('path');
import fs = require('fs');
import express = require('express');
import * as utils from "../common/utils";
import {GetPort} from './utils/getPort';

const devtimeDetectionFile = __dirname + '/devtime.txt';

let webpackDevServerPort = 0;
let devTimeProxy: (req: express.Request, res: express.Response, next: Function) => void = null;
const bundleDevTimeProxy = () => {
    if (devTimeProxy) return devTimeProxy;

    /**
     * Provide a proxy server that will pass your requests to webpack if a webpack port is found
     */
    const httpProxy = require('http-proxy');
    const proxyServer = httpProxy.createProxyServer();
    devTimeProxy = function(req: express.Request, res: express.Response, next) {
        if (!webpackDevServerPort) next();

        proxyServer.web(req, res, {
            target: `http://127.0.0.1:${webpackDevServerPort}`
        });
        proxyServer.on('error', (err) => {
            console.log('[WDS] Proxy ERROR', err);
        });
    }

    new GetPort().startPortSearch(8888, (port) => {

        // console.log('found port', port); // DEBUG

        webpackDevServerPort = port;

        const Webpack = require('webpack');
        const WebpackDevServer = require('webpack-dev-server');
        const notification = '[WDS]'; // Webpack dev server

        /**
         * Update the prod config for dev time ease
         */
        const devConfig = Object.create(config);
        // Makes sure errors in console map to the correct file and line number
        devConfig.devtool = 'eval';
        // Add aditional entry points
        devConfig.entry = [
            // For hot style updates
            require.resolve('webpack/hot/dev-server'),
            // The script refreshing the browser on hot updates
            `${require.resolve('webpack-dev-server/client')}?http://127.0.0.1:${webpackDevServerPort}`,
            // Also keep existing
        ].concat(config.entry);

        // Add the Hot Replacement plugin for hot style updates
        devConfig.plugins.push(new Webpack.HotModuleReplacementPlugin());

        /**
         * Standard webpack bundler stuff
         */
        const compiler = Webpack(devConfig);
        compiler.plugin('compile', function() {
            console.log(`${notification} Bundling ..... `)
        });
        compiler.plugin('done', function(result) {
            console.log(`${notification} Bundled in ${(result.endTime - result.startTime)} ms!`);
        });

        /**
         * Wrap up the bundler in a dev server
         */
        const bundler = new WebpackDevServer(compiler, {

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
        /** Listen on all local address. If we don't then our `getPort` breaks on a mac */
        bundler.listen(webpackDevServerPort, '0.0.0.0', function() {
            console.log(`${notification} Server listening on port: ${webpackDevServerPort}`);
        });

    });

    return devTimeProxy;
}

function bundleDeploy() {
    // build
    const Webpack = require('webpack');
    const compiler = Webpack(config);
    compiler.run((err, stats) => {
        if (err) {
            console.error('Failed to refresh bundle', err);
        }
        else {
            console.log('Refreshed bundle');
        }
    });
}

function addDevHeaders(res: express.Response) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
}

export function setup(app: express.Express) {

    /**
     * We always refresh the build bundle if it isn't there.
     * This is to help *new repo clones* . NPM installs get this file by default.
     */
    const outFile = path.join(config.output.path, config.output.filename);
    if (!fs.existsSync(outFile)) {
        bundleDeploy();
    }

    /**
     * Check for devtime
     */
    let devTime = fs.existsSync(devtimeDetectionFile);
    if (devTime){
        // if started with dev mode start the bundling process immediately
        bundleDevTimeProxy();
    }

    /**
     * Proxies to dev server if devtime
     */
    app.all('/build/*', function(req, res, next) {
        if (devTime) {
            bundleDevTimeProxy()(req, res, next);
        }
        else {
            next();
        }
    });

    /**
     * Disables caching if devtime
     */
    app.use('/', function(req, res, next) {
        if (devTime) {
            addDevHeaders(res);
        }
        next();
    });

    /**
     * Dev time vs. prod time toggling
     */
    app.use('/dev', (req, res, next) => {
        addDevHeaders(res);
        devTime = true;
        fs.writeFileSync(devtimeDetectionFile, 'If this file exists the server will start in dev mode');
        res.send('Hot Reload setup!')
    });
    app.use('/prod', (req, res, next) => {
        bundleDeploy();
        addDevHeaders(res);
        if (devTime) {
            devTime = false;
            fs.unlinkSync(devtimeDetectionFile);
        }
        res.send('Using static bundled files')
    });
}
