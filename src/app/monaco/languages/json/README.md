# What's here

This folder contains a bunch of stuff needed to parse json mostly pulled off the internet. Origin sources are mentioned in the headers.

# Core Folder
mostly copied with simple modifications:
* core/jsonc-parser: The `scanner` really.
* core/jsonParser: The fancy stuff. The `parser` + Validator (using a provided schema)
* core/jsonLocation: just helps manage json paths (`foo.bar.bas` etc). Also helps match e.g. (`foo.*` etc)
* core/localize: don't want to take a dependency on VSCode localize. So a simple replacement function
* core/jsonSchema: just the interface declaring the structure of json schemas.

# Services Folder
Still stuff from VSCode but heavily modified to use the above ^ to give intelligence based on how I wanted it

* `jsonSchemaService.ts`
* `jsonCompletion.ts` file is the one I needed to customize to get what I wanted for our types.

# Schemas Folder
These files are download from http://schemastore.org/json/

# Monaco Stuff:
* monacoJson: The entry point for monacoJson stuff.
* tokenization: Provides the syntax highlighting for monaco.

## Background

Monaco json support is split into the following packages:

* https://github.com/Microsoft/monaco-json The language support
* https://github.com/Microsoft/vscode-json-languageservice The brain behind the language support

This is slightly a problem for us primarily because it makes it difficult to figure out where we are going to put our hooks.

Since I've already worked with this (vscode) code base before I'm brining in the stuff as I understand documenting the what and the why.
