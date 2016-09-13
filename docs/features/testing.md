# Testing

Having your test results integrated into the IDE is a feature that can greatly enhance any test driven development experience. We support `mocha` based testing out of the box ([mocha reigns as the king of testing frameworks][stats]).

## Configuration

Add a simple `alm.json` at the root working directory of your project e.g.:

```json
{
  "tests": {
    "include": [
      "./src/tests/**/*_spec.ts",
      "./src/tests/**/*_spec.tsx"
    ]
  }
}
```
Optionally you can also provide an `exclude` pattern.

> `include` and `exclude` have the same behaviour as TypeScript's tsconfig. In fact we use the ts compiler to expand these.

Testing is automatically enabled if such a file is detected and disabled otherwise.

## Status bar

If a testing configuration is detected in `alm.json` we run the tests and show you the test count / fails / passes in the status bar.

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/tested/statusBarIcon.png)

## Inline
`console.log` and errors are shown inline in the editor.

> TIP: you can use a test file to quickly test out some TypeScript you are writing ;)

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/tested/testedOverview.gif)

## Gutter
We show test statuses in the editor gutter ⚽.

## Test Results View
Clicking on the status bar section for testing or running the `Test Results View` command opens up a test browser.

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/tested/liveUpdates.gif)

## Running without alm

Install `mocha` and `ts-node` and `typescript`. Now you can add something like the following to your package.json:

```
  "test": "mocha --compilers ts:ts-node/register,tsx:ts-node/register"
```

now `npm run test` 🌹.

[stats]: http://www.npmtrends.com/mocha-vs-jasmine-vs-qunit-vs-jest-vs-ava
