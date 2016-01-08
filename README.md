# ALM tools for TypeScript

[![Join the chat at https://gitter.im/alm-tools/alm](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/alm-tools/alm?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

> With a great language comes great development tools.

[![Build Status](https://travis-ci.org/alm-tools/alm.svg?branch=master)](https://travis-ci.org/alm-tools/alm)

> ⚠️ This project is not on NPM yet. Lookout for final release by about 2017. 🌟 it to help it move along 🌹

## Why

* [Super easy to setup](https://github.com/alm-tools/alm/tree/master#usage). Just `npm install` and open your browser.

* There are lots of [other reasons why you might use this project OR use the source code](https://github.com/alm-tools/alm/blob/master/docs/contributing/why.md). Effectively this is `transpiler`, `editor`, `analyzer`, `DX workflow` rolled into one.

## Requirements
This is a forward looking project that plans to use the latest tech as it becomes available:

* You need a recent version of NodeJS (V4 and above).
* You need Google Chrome.

That is it!

## Usage

> Till we consider it stable for release we are not pushing to NPM. So for now you need to get it using the [CONTRIBUTING guide](https://github.com/alm-tools/alm/blob/master/docs/contributing/README.md).

Get it:
```
npm install alm -g
```

Run it passing in the directory you want to serve up:
```
alm .
```

Now open it in your favorite browser (pssst `chrome`) at the URL mentioned in your console. (**protip** use `alm -o`)

![main](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/main.png)

## Features

Checkout the [feature documentation](https://github.com/alm-tools/alm/tree/master/docs/features).

## Command Line
All of these are **optional**:

* `-o`: Open the browser on the server
* `-d <directory>` : Specify a working directory
* `-p <port>`: Specify a custom port number
* `-c <pathToTsconfig>`: Specify a path to the active project. [More](https://github.com/alm-tools/alm/tree/master#tsconfig)
* `--safe`: To ignore any previous session data in `.alm` folder

## TSConfig
TypeScript projects are configured using `tsconfig.json`. If you don't provide one on the command line we will do the following in order:
* See if the last session had one and use that
* Check common locations (e.g. `.`, `./src`, `./ts` etc.)
* Wait for you to specify one using project search command from the UI.

## License

MIT
