#!/bin/bash
set -e

# Compile
npm run tsc

# Bundle
./node_modules/.bin/webpack -p --define process.env.NODE_ENV='"production"' --config ./src/webpack.config.js
