#!/bin/bash
set -e

# Compile
./node_modules/.bin/ntsc -p ./src

# Bundle
./node_modules/.bin/webpack -p --define process.env.NODE_ENV='\"production\"' --config ./src/webpack.config.js
