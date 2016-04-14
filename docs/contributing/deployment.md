# Deployment
Once you are happy with the code:
* Just run [`npm version`](https://docs.npmjs.com/cli/version) with `major` OR `minor` OR `patch`.
* Push the outcome to github (`git push --follow-tags`). Travis will automatically deploy tagged commits to NPM!
* Write release notes on Github https://github.com/alm-tools/alm/releases.

## Release Guidelines
* Be sure to mention any breaking changes at least 🌹.
* TypeScript version upgrades should be considered a minor release. Try to link to reasons for upgrading TypeScript (some new cool feature or fix you wanted).
* If there is a significant change in the TypeScript compiler consider doing a major release.

# Initial Travis Setup
*Just for record on how this was setup*.
* Add a .travis.yml file
* Toggle switch on travis using https://travis-ci.org/
* NPM deploy setup by simply running `travis setup npm` (you get `travis` from `gem install travis`). Then setup the API key using https://github.com/npm/npm/issues/8970#issuecomment-122854271
* all_branches is set to true because of https://github.com/travis-ci/travis-ci/issues/1675#issuecomment-37851765
