# Setup
```
git clone https://github.com/basarat/tsb.git
cd tsb
npm install
npm link 
```

Now you can run `tsb`. 

We highly recommend you use [`nodemon`](https://github.com/remy/nodemon): 

```
npm install nodemon -g
nodemon
```

# IDE
We presently use [`atom-typescript`](https://atom.io/packages/atom-typescript). Eventually this project should be self hosting. 

```
atom .
```

## Webpack
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