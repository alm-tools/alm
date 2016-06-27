# What's here

This folder contains a bunch of stuff needed to parse json mostly pulled off the internet. Origin sources are mentioned in the headers.

* core/jsonc-parser: The `scanner` really.


## Background

Monaco json support is split into the following packages:

* https://github.com/Microsoft/monaco-json The language support
* https://github.com/Microsoft/vscode-json-languageservice The brain behind the language support

This is slightly a problem for us primarily because it makes it difficult to figure out where we are going to put our hooks.

Since I've already worked with this (vscode) code base before I'm brining in the stuff as I understand documenting the what and the why.
