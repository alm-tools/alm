# Lint

We provide a high quality integration with tslint that works as a `warning` system consolidated with the TypeScript error analysis.

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/linter.png)

## tslint.json

Configuration is driven with `tslint.json`. We determine the `tslint.json` with a simple findup from the current `tsconfig.json` so the closest one wins ❤️.

> We recommend a single `tslint.json` file in your project.

## Built in Project support

We integrate tslint with the TypeScript project that is currently active which is essentially the same as `tslint --project <activeProject> --type-check`. This allows you to use fancy tslint rules that depend upon the *types* of various variables.

## Whole project linting

We lint every file in your current TypeScript project and live refresh that in the background so you always get the up to date list of all the things that might be wrong.

> We ignore `.d.ts` as tslinting these (mostly generated) files is garbage 🌹
