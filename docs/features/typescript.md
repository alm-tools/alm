# TypeScript features

As we mentioned the editor design revolves around giving you the best access to the TypeScript language service.

* [Syntax Highlighting](#syntax-highlighting)
* [Rename Refactoring](#rename-refactoring)
* [Tag, Bracket and Text matching](#matching)
* [Auto close JSX tags](#tags)
* [Doctor](#doctor)
* [Go to Definition](#goto-definition)
* [Find References](#find-references)
* [Sync](#sync)

# Syntax Highlighting
Not just another text mate based grammar which [despite a lot of love](https://github.com/Microsoft/TypeScript-TmLanguage/blob/ab17d24fed148cd789fd632d74f170c7308d75ff/TypeScriptReact.tmLanguage) can still fall short. Compare:

### Textmate
![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/grammarBad.png)

### Us
![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/grammarGood.png)

This is because *we use the exact same code that TypeScript uses to carry out its blazing fast compile*. Also we give all the more love that we can.

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/grammarLove.png)

# Rename Refactoring
Start a rename refactoring and we show you an easy to view list of things that will change.

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/renameBig.gif)

And if its a local change we will even allow you to do it inline.

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/renameSimple.gif)

# Matching
Matching tags and brackets and words are highlighted automatically, this means less searching, more doing

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/matching.gif)

# Tags
Cause we love TSX so much, we auto close TSX tags. Built with the power of the TypeScript's JSX parser so it can't be wrong.

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/autoCloseTags.gif)

# Doctor
All the joys of inline information without the frustrations of keyboard shortcut, shifting text or dialog overloads. Toggle : `Ctrl|⌘ + '`

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/doctor.png)

# Goto Definition

Easy as `Ctrl|⌘ + B`

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/gotoDefinition.gif)

# Find References

Easy as `Ctrl|⌘ + Shift + B`

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/findReferences.gif)

# Sync

If anything goes bad with our error analysis (it shouldn't but edge cases happen!), you can do a `sync` command (`Shift + F6`).

With `sync` we do:
* Tsconfig re-evaluation
* Complete refresh of Error analysis
