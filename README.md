# ALM tools for TypeScript

[![Join the chat at https://gitter.im/alm-tools/alm](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/alm-tools/alm?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

> Great language come with great development tools.

[![Build Status](https://travis-ci.org/alm-tools/alm.svg?branch=master)](https://travis-ci.org/alm-tools/alm)

> ⚠️ This project is not on NPM yet. Lookout for final release by about 2017. 🌟 it to help it move along 🌹

## Why

* [Super easy to setup](https://github.com/alm-tools/alm/tree/master#usage). Just `npm install` and open your browser.

* There are lots of [other reasons why you might use this project OR use the source code](https://github.com/alm-tools/alm/blob/master/docs/contributing/why.md). Effectively this is `transpiler`, `editor`, `analyzer`, `DX workflow` rolled into one.

## Requirements
The requirements are what you would already have for even a basic NodeJS developer:

* NodeJS (V4 and above).
* Google Chrome.
* Git available on system path.

That is it!

## Usage

> Till we consider it stable for release we are not pushing to NPM. So for now you need to get it using the [CONTRIBUTING guide][contributing].

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

> [We work hard :construction_worker: on our :memo:][docs]

[![][cover]][docs]


## Contributing
A key motivation for this project is to educate the community of about creating great TypeScript tools. So we would love to help you understand how the project works. [Checkout the developer / contributor docs](./docs/contributing/README.md).

## License

MIT

[docs]: https://basarat.gitbooks.io/alm/content/
[contributing]: https://basarat.gitbooks.io/alm/content/contributing/
[cover]: https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/cover_small.png
