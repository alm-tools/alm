# Lint

We provide a high quality integration with tslint.

## tslint.json

Determine the `tslint.json` with a simple findup. We recommend a single `tslint.json` file in your project.

## Built in Project support

We integrate tslint with the TypeScript project that is currently active which is essentially the same as `tslint --project <activeProject> --type-check`. This allows you to use fancy tslint rules that depend upon the *types* of various variables.
