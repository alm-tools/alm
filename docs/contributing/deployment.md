# Deployment

Once you are happy with the code:
* Just run [`npm version`](https://docs.npmjs.com/cli/version) : `npm version major` OR `npm version minor` OR `npm version patch`.
* Write release notes on Github https://github.com/alm-tools/alm/releases.

**Sample Output**

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/deployment.png)

> You must have `git` on your system path for this to work.

## Release Guidelines
* **Release Notes** : In general be sure to mention any breaking changes  🌹.
* **Release Notes** : Try to link to reasons for upgrading TypeScript (some new cool feature or fix you wanted).
* **Semantic** : TypeScript version upgrades should be considered at least a minor release.
* **Semantic** : If there is a significant change in the TypeScript compiler consider doing a major release.
