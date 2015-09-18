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

# After a pull
`npm link` 

This will just run the right things again (install + initial compile).

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

* Visit `/dev` to enable dev workflow and then test app
* Visit `/prod` to enable min js workflow and then test app

More Reading (I haven't read these....but I just read the code): 
* [Hot reloading docs](https://github.com/webpack/docs/wiki/hot-module-replacement-with-webpack) 


# Conventions
Please see [CONVENTIONS.md]('./CONVENTIONS.md')


# Server Folder Structure

* `server/workers` we run various background workers. They are present here.
* `server/lang` our main API stuff on top of the core TypeScript Language Service.