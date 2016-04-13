# Formatting
Because we want to provide a great editing experience we have put deep thought into providing a great code formatting experience.

## General Configuration
We support the following key [editorconfig][editorconfig] properties out of the box. This means we are a good OSS citizen for more than just TypeScript.

* `end_of_line`: `lf` | `crlf` | `os` (Default. This is recommended for git reasons 🌹)
* `indent_size`: `:number` (Default: 2)
* `indent_style`: `tab` | `space` (Default)

* `tab_width`: `:number` (Default: 2) Note : only relevant if you use `tab`s

Just create an `.editorconfig` file in the root of your project.

## TypeScript specific configuration
For TypeScript specific stuff you can use the `formatCodeOptions` key in [`tsconfig.json`][tsconfig.json].

[editorconfig]:http://editorconfig.org/
[tsconfig.json]:/features/tsconfig.md

[NotReallyUsed]: the-following-is-not-really-used-but-I-wanted-to-keep-these-links
[editorOptions]: https://github.com/alm-tools/alm/blob/master/src/server/disk/editorOptions.ts
