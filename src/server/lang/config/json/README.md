This folder contains a bunch of stuff needed to parse json mostly pulled off the internet.
Origin sources are mentioned in the headers

* localize: don't want to take a dependency on VSCode localize. So a simple replacement function
* jsonc : just the `scanner`.
* jsonSchema: just the interface declaring the structure of json schemas.
* jsonLocation: just helps manage json paths (`foo.bar.bas` etc). Also helps match e.g. (`foo.*` etc)
