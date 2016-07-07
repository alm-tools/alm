# Editor config
Because we want to provide a great editing experience that complements your other editors we have put deep thought into providing a great code formatting experience.

## General Configuration
![](http://editorconfig.org/logo.png)

We support the following key [editorconfig][editorconfig] properties out of the box. This means we are a good OSS citizen for more than just TypeScript.

* `end_of_line`: `lf` | `crlf` | `os` (Default. This is recommended for git reasons 🌹)
* `indent_size`: `:number` (Default: `2`)
* `indent_style`: `tab` | `space` (Default: `space`)
* `trim_trailing_whitespace`: `:boolean` (Default: `false`)
* `insert_final_newline`: `:boolean` (Default: `false`)
* `tab_width`: `:number` (Defaults to `indent_size`)

> Note : `tab_width` is only relevant if you use `tab`s (which we don't recommend you use anyways).

Just create an `.editorconfig` file in the root of your project. Here is a sample:

```ini
root = true

[*.{js,jsx,ts,tsx}]
indent_style = space
indent_size = 2
trim_trailing_whitespace = true
insert_final_newline = true
```

> `root = true` stops editorconfig from search further up the directory for any other `.editorconfig` files that might match.

## TypeScript Formatting Configuration


For TypeScript specific stuff you can use the `formatCodeOptions` key in [`tsconfig.json`][tsconfig.json].

[editorconfig]:http://editorconfig.org/
[tsconfig.json]:/config/tsconfig.md

[NotReallyUsed]: the-following-is-not-really-used-but-I-wanted-to-keep-these-links
[editorOptions]: https://github.com/alm-tools/alm/blob/master/src/server/disk/editorOptions.ts
