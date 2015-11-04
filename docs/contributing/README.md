# Setup
```
git clone https://github.com/basarat/tsb.git
cd tsb
npm install
npm link
```

Now you can run `tsb`.

We highly recommend you use [`nodemon`](https://github.com/remy/nodemon), just run it from the project root:

```
npm install nodemon -g
nodemon
```

If you edit any front-end ts file our Webpack setup (more on this later) will reload the front end only. Make a change to some backend file and the app restarts :rose:

# After moving a new machine
I quite often work on my personal laptop during my 1 hour one way commute and need to setup the machine quickly, so on the new machine:

```
npm run resume
```

This will just run the right things again (pull + install + initial compile).

# IDE
We presently use [`atom-typescript`](https://atom.io/packages/atom-typescript). Eventually this project should be self hosting.

```
atom .
```

# Webpack
The workflow we are using is similar to [the one documented here](http://www.christianalfoni.com/articles/2015_04_19_The-ultimate-webpack-setup)

The meanings of these folders comes from that
```
src/app
src/public
src/server
webpack.config.js
```

In addition to that we make it easier to test the app as it would appear after npm publish:

* Visit `/prod` to enable min js workflow and then test app. Live reload will be disabled.
* Visit `/dev` to go back to the dev time workflow.

More Reading (I haven't read these....but I just read the code):
* [Hot reloading docs](https://github.com/webpack/docs/wiki/hot-module-replacement-with-webpack)


# Conventions
Please see [CONVENTIONS.md]('./CONVENTIONS.md')


# Server Folder Structure

* `server/workers` we run various background workers. They are present here.
* `server/lang` our main API stuff on top of the core TypeScript Language Service.

# Deployment
Please see [DEPLOYMENT.md]('./DEPLOYMENT.md')
