#!/bin/bash
set -e

# Move to production
NODE_ENV="production"

# Compile
./node_modules/.bin/ntsc -p ./src

# Bundle
./node_modules/.bin/webpack -p --config ./src/webpack.config.js
