This folder contains a bunch of stuff needed to parse json mostly pulled off the internet.
Origin sources are mentioned in the headers

* localize: don't want to take a dependency on VSCode localize. So a simple replacement function
* jsonSchema: just the interface declaring the structure of json schemas.
* jsonLocation: just helps manage json paths (`foo.bar.bas` etc). Also helps match e.g. (`foo.*` etc)
* jsonParser: The fancy stuff. The `parser` + Validator (using a provided schema)

## Service Folder

Still stuff from VSCode but heavily modified to use the above ^ to give intelligence based on how I wanted it

* `jsonSchemaService.ts`
* `jsonCompletion.ts` file is the one I needed to customize to get what I wanted for our types.
