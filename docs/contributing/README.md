# Setup
```
git clone https://github.com/alm-tools/alm.git
cd alm
npm install
npm link
```

Now you can run `alm`

We highly recommend you use [`nodemon`](https://github.com/remy/nodemon), just run it from the project root:

```
npm install nodemon -g
nodemon
```

# Workflow

Once you have `nodemon` running, if you edit any front-end ts file our Webpack setup will reload the front end only. Make a change to some backend file and the app restarts :rose:

# IDE
We presently use [`atom-typescript`](https://atom.io/packages/atom-typescript). Eventually this project should be self hosting.

```
atom .
```

We critically use it for fast `.ts` -> `.js` workflow.

# Webpack
All our front-end js gets minified into `bundle.js`. This is what gets npm deployed.

For dev time we have a setup (all code in `devtime.ts`) where we start a `WebpackDevServer` and proxy the `bundle.js` requests to it, additionally loading the hot loader to refresh our UI if any front-end JS changes.

The meanings of some key folders:
```
src/app            -> all our front-end (main entry point called `main.ts`)
src/public/build   -> bundle.js and other generated resources go here
src/server         -> our backend code (main entry point called `server.ts`)
src/common         -> Shared between server /client. No server or client only code.
webpack.config.ts  -> our webpack config shared between devtime and what gets npm deployed
```

In addition to that we make it easier to test the app as it would appear after npm publish:

* Visit `/prod` to see the app as it would work after npm publish and then test app. Live reload will be disabled.
* Visit `/dev` to go back to the dev time workflow.

More reading (You don't need to read these ... but if you are bored):
* [Hot reloading docs](https://github.com/webpack/docs/wiki/hot-module-replacement-with-webpack)
* [Some ideas borrowed from here](http://www.christianalfoni.com/articles/2015_04_19_The-ultimate-webpack-setup)

# Server Folder Structure

* `server/workers` we run various background workers. They are present here.
* `server/lang` our main API stuff on top of the core TypeScript Language Service.

# How does the frontend talk to the backend
Documented in the [principles of ASYNC](./ASYNC.md).

# How is global state managed
State for visual components in mostly managed by redux which we have made type-safe. [Checkout the docs](./REDUX.md).

# Conventions
Please see [CONVENTIONS.md](./CONVENTIONS.md)

# Deployment
Please see [DEPLOYMENT.md](./DEPLOYMENT.md)

# Various NPM commands

### After moving a new machine
I quite often work on my personal laptop during my 1 hour one way commute and need to setup the machine quickly, so on the new machine:

```
npm run resume
```

This will just run the right things again (pull + install + initial compile).

### Updating TypeScript Version
We use [NTypeScript](https://github.com/TypeStrong/ntypescript). NTypeScript keeps itself updated with Microsoft/Typescript every night. To update the version used by alm.tools simply run
```
npm run update
```
This will install the latest version of NTypeScript and run a build to make sure everything still compiles.

### Running tsc in watch mode
If you did something which resulted in a lot of errors you can run tsc in watch mode in a new window:

```
npm run tscw
```
