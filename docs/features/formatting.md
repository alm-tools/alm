## Formatting

Flowless, easy and automatic formatting experience is key to a great IDE experience and one that is highly supported by the TypeScript compiler.

When you run the `Editor: Format Code` command (`Ctrl|⌘ + Alt| + L`) formatting occurs on any selected text (if any) or the entire code file.

* Selected text

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/format/formatSelected.gif)

* Whole file

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/format/formatWholeFile.gif)


### Configuration

Formatting options are configured using [`.editorconfig`][editorconfig] (general editor options) + [`tsconfig.json`][tsconfig]'s `formatCodeOptions` (TypeScript specific options).

### Auto indent

Auto indenting TypeScript is also driven by the *compiler* code instead of brittle regexes. It happens automatically on `enter`

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/format/autoIndent.gif)

### Auto format

Not only does indentation happen automatically. Formatting also happens automatically on `enter` `;` `}`. Trye and spot all the times the code is automatically getting formatted in the gif below

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/format/autoFormat.gif)

[editorconfig]:/config/editorconfig.md
[tsconfig]:/config/tsconfig.md
