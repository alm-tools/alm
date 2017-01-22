> Our goal with this project is to have a super simple + low barrier to entry for development. All you should need is nodejs + git. There should be be no complexity in the development setup or workflow 🌹

NOTE: if you plan to work on a new feature please ask on gitter first https://gitter.im/alm-tools/alm. We are focused on a great default UX with limited customizability so not all features will be accepted.

# Requirements
You need:

* git (If you are windows please install the version of git that has git bash and run `npm install` from that).
* node v5+

# Setup
```
git clone https://github.com/alm-tools/alm.git
cd alm
npm install
```
Also you can use this *build* version of `alm` on another folder e.g. `your project` (i.e not our folder with our test files) simply by running:

```
npm link
```

# Workflow

Once you have `npm start` running, if you edit any front-end ts file our Webpack setup will reload the front end only. Make a change to some backend file and our running nodemon will make the whole app restart 🌹

# IDE

We use alm to develop alm.

* ONCE (or whenever you want an update): Run `npm run ualm` to copy the current alm copy to node_modules

You run two instances of alm, once where you dev, and one where you test what you have written.

## Where you dev

* Run `npm run alm` to launch alm to develop alm.

> You are free to use some other IDE if you want. You can run `npm run tscw` to run the TypeScript in the background in watch mode and use your favorite IDE in the foreground.

## Where you test
* Run `npm start` in another window to start alm in live reload mode. Open the url mentioned in the console.

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
Documented in the [principles of ASYNC][async].

# How is global state managed
State for visual components in mostly managed by redux which we have made type-safe. [Checkout the docs][redux].

# Conventions
Please see [conventions.md][conventions]

# Deployment
Please see [deployment.md][deployment]

# Various NPM commands

### After moving a new machine
I quite often work on my personal laptop during my 1 hour one way commute and need to setup the machine quickly, so on the new machine:

```
npm run resume
```

This will just run the right things again (pull + install + initial compile).

### Updating TypeScript Version
We use [byots](https://github.com/basarat/byots) as it makes more of the compiler API public for our usage. `byots` is updated with Microsoft/Typescript every night. To update the version used by alm.tools simply run
```
npm run uts
```
This will install the latest version of TypeScript + Byots and run a build to make sure everything still compiles.

> Note: `byots` makes the `ts` variable available globally in our backend / frontend  code bases. So you don't need to do any explicit `import * as ts` in new files.

> Also be sure to checkout the [deployment guide][deployment].

### Running tsc in watch mode
If you did something which resulted in a lot of errors you can run tsc in watch mode in a new window:

```
npm run tscw
```

### Working on another branch
Get the latest git commits from that branch. Next all you need to do is `npm install`. Now run `nodemon` like you would normally do.

# Idea Tracking
Since I am still doing a lot of *thinking* then *rethinking* I'm trying not to put too much stuff in the [issues][issues] as it spams the watchers. Instead I've been using a private trello but its very *raw* (like a pen an paper). Feel free to ask me questions on [gitter][gitter] about what's in my headspace. I try to be open about it on [twitter][twitter] anyways.

[issues]: https://github.com/alm-tools/alm/issues
[gitter]: https://gitter.im/alm-tools/alm
[twitter]: https://twitter.com/basarat
[async]: ./async.md
[conventions]: ./conventions.md
[deployment]: ./deployment.md
[redux]: ./redux.md
