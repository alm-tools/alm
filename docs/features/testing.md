# Testing

Having your test results integrated into the IDE is a feature that can greatly enhance any test driven development experience. We support `mocha` based testing out of the box ([mocha reigns as the king of testing frameworks][stats]).

## Configuration

Add a simple `alm.json` at the root working directory of your project:

```json
{
  "tests": {
    "include": [
      "./src/tests/**/*"
    ]
  }
}
```
Optionally you can also provide an `exclude` pattern.

> `include` and `exclude` have the same behaviour as TypeScirpt's tsconfig. In fact we use the ts compiler to expand these.

Testing is automatically enabled if such a file is detected and disabled otherwise.

## Status bar

If testing is enabled we show you the test count / fails / passes in the status bar.


[stats]: http://www.npmtrends.com/mocha-vs-jasmine-vs-qunit-vs-jest-vs-ava
