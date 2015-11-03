# Deployment
Just run [`npm version`](https://docs.npmjs.com/cli/version) with major/minor/patch. Once you push the outcome to github we will automatically deploy to NPM.

# Initial Travis Setup
*Just for record on how this was setup*.
* Add a .travis.yml file
* Toggle switch on travis using https://travis-ci.org/
* NPM deploy setup by simply running `travis setup npm` (you get `travis` from `gem install travis`). Then setup the API key using https://github.com/npm/npm/issues/8970#issuecomment-122854271
