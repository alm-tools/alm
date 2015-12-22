# ALM tools for TypeScript

[![Join the chat at https://gitter.im/basarat/alm](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/basarat/alm?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

> With a great language comes great development tools.

[![Build Status](https://travis-ci.org/basarat/alm.svg?branch=master)](https://travis-ci.org/basarat/alm)

> ⚠️ This project is not ready. Lookout for final release by about 2017 (patience and persistence), just making it public to be clear on *what I am working on*. 🌟 it to help it move along 🌹

**Why TypeScript?**

You can build *complete* applications with a single language > this means you can have dev tools (like this) that can understand *your entire project*.

* This project is TypeScript first. We want to provide the **greatest** development and analysis experience for TypeScript. Every feature revolves around this goal, and we have features unique to TypeScript development.
* [Super easy to setup](https://github.com/basarat/alm/tree/master#usage). Just `npm install` and open your browser.

There are lots of [other reasons why you might use this project OR use the source code](https://github.com/basarat/alm/blob/master/docs/contributing/why.md). Effectively this is `transpiler`, `editor`, `analyzer`, `DX workflow` rolled into one.

## Requirements
This is a forward looking project that plans to use the latest tech as it becomes available:

* You need the latest version of NodeJS (at least v4).
* You need Google Chrome.

That is it!

## Usage

> Till we consider it stable for release we are not pushing to NPM. So for now you need to get it using the [CONTRIBUTING guide](https://github.com/basarat/alm/blob/master/docs/contributing/README.md).

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

## Command Line
All of these are **optional**:

* `-o`: Open the browser on the server
* `-d <directory>` : Specify a working directory
* `-p <port>`: Specify a custom port number
* `--safe`: To ignore any previous session data in `.alm` folder

## License

MIT
