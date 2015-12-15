> Not all these features might be pushed to npm yet. Remember the planned release is 2017 :rose:

**TIP** Keyboard shortcut `Ctrl|⌘` means `Ctrl` on windows and `⌘` on Mac.

# Features

* [Editor](#omni-search)
    * [Omni Search](#omni-search)
        * [File Search](#file-search)
        * [Command Search](#command-search)
        * [Symbol Search](#symbol-search)
        * [Project Search](#project-search)
    * [Sublime Text Users](#sublime)
    * [Seamless external editing](#disk-watching)
    * [Editing First](#focus)
    * [Jumpy](#jumpy)
    * [Multi Monitor](#multi-monitor)
    * [Cursor History](#cursor-history)
    * [Clipboard Ring](#clipboard-ring)
    * [Blaster](#blaster)
* [TypeScript](#errors)
    * [Errors](#errors)
    * [Syntax Highlighting](#syntax-highlighting)
    * [Rename Refactoring](#rename-refactoring)
    * [Tag, Bracket and Text matching](#matching)
    * [Doctor](#doctor)
    * [Go to Definition](#goto-definition)
    * [Find References](#find-references)
    * [Active Lists](#active-list)

# Omni Search
Single place for common search queries, supports various modes:

## File Search

![](https://raw.githubusercontent.com/TypeScriptBuilder/typescriptbuilder.github.io/master/screens/omnisearch.gif)

## Command Search

Use the command search (`Ctrl|⌘ + Shift + P`) to see all the shortcuts at your disposal.

![](https://raw.githubusercontent.com/TypeScriptBuilder/typescriptbuilder.github.io/master/screens/commandSearch.gif)


## Symbol Search
The s**Y**mbol search mode (`Ctrl|⌘ + Shift + Y`) lets navigate your projects with meaning

![](https://raw.githubusercontent.com/TypeScriptBuilder/typescriptbuilder.github.io/master/screens/symbolSearch.gif)

## Project Search

Search for and set the **active** TypeScript project (`tsconfig.json`) using project search (`Alt + Shift + P`)

![](https://raw.githubusercontent.com/TypeScriptBuilder/typescriptbuilder.github.io/master/screens/projectSearch.gif)

# Sublime
> Imitation is the sincerest form of flattery

Sublime users will feel right at home as they get to use all their favorite features as it is e.g. `Mod + P` (find file), `Mod + Shift + P` (find command), `Mod + /` (comment uncomment code), `Mod + D` (select next match) and even `Alt + Shift + ⇅` for column selection   

![](https://raw.githubusercontent.com/TypeScriptBuilder/typescriptbuilder.github.io/master/screens/rectangular.gif)

# Disk Watching
> The file on disk will set you free

You can use this side by side with your favorite editor.

![](https://raw.githubusercontent.com/TypeScriptBuilder/typescriptbuilder.github.io/master/screens/seemlessExternalEditing.gif)

# Focus
No matter where you are, `esc` will always take you to the currently focused editor, so you can do what you do best, **write code**.

![](https://raw.githubusercontent.com/TypeScriptBuilder/typescriptbuilder.github.io/master/screens/esc.gif)

# Jumpy
Just press `shift+enter` and you can jump anywhere in the current editor.

![](https://raw.githubusercontent.com/TypeScriptBuilder/typescriptbuilder.github.io/master/screens/jumpy.gif)

# Multi Monitor
Need to use more than one monitor? Just open a new browser window! As many as you like, cause they all sync up!

![](https://raw.githubusercontent.com/TypeScriptBuilder/typescriptbuilder.github.io/master/screens/multiMonitor.gif)

# Cursor History
Your cursor history is preserved across all open files. `Ctrl|⌘ + U` and `Ctrl|⌘ + Shift + U`.

![](https://raw.githubusercontent.com/TypeScriptBuilder/typescriptbuilder.github.io/master/screens/cursorHistory.gif)

# Clipboard Ring
You can cycle paste through the stuff that you copied / cut from the IDE. `Shift + Ctrl|⌘ + V`. Don't lose your head due to a nasty cut/copy error.

![](https://raw.githubusercontent.com/TypeScriptBuilder/typescriptbuilder.github.io/master/screens/clipboardRing.gif)

# Blaster
Because life is too short for code not to be fun. `Ctrl|⌘ + Shift + O` to toggle.

![](https://raw.githubusercontent.com/TypeScriptBuilder/typescriptbuilder.github.io/master/screens/blaster.gif)

# Errors

We don't just lint your current file, *we do the entire active project*. No black magic needed.

![](https://raw.githubusercontent.com/TypeScriptBuilder/typescriptbuilder.github.io/master/screens/liveLinting.gif)

# Syntax Highlighting
Not just another text mate based grammar which [despite a lot of love](https://github.com/Microsoft/TypeScript-TmLanguage/blob/ab17d24fed148cd789fd632d74f170c7308d75ff/TypeScriptReact.tmLanguage) can still fall short. Compare:

### Textmate
![](https://raw.githubusercontent.com/TypeScriptBuilder/typescriptbuilder.github.io/master/screens/grammarBad.png)

### Us
![](https://raw.githubusercontent.com/TypeScriptBuilder/typescriptbuilder.github.io/master/screens/grammarGood.png)

This is because *we use the exact same code that TypeScript uses to carry out its blazing fast compile*.

# Rename Refactoring
Start a rename refactoring and we show you an easy to view list of things that will change.

![](https://raw.githubusercontent.com/TypeScriptBuilder/typescriptbuilder.github.io/master/screens/renameBig.gif)

And if its a local change we will even allow you to do it inline.

![](https://raw.githubusercontent.com/TypeScriptBuilder/typescriptbuilder.github.io/master/screens/renameSimple.gif)

# Matching
Matching tags and brackets and words are highlighted automatically, this means less searching, more doing

![](https://raw.githubusercontent.com/TypeScriptBuilder/typescriptbuilder.github.io/master/screens/matching.gif)

# Doctor
All the joys of inline information without the frustrations of keyboard shortcut, shifting text or dialog overloads. Toggle : `Ctrl|⌘ + '`

![](https://raw.githubusercontent.com/TypeScriptBuilder/typescriptbuilder.github.io/master/screens/doctor.png)

# Goto Definition

Easy as `Ctrl|⌘ + B`

![](https://raw.githubusercontent.com/TypeScriptBuilder/typescriptbuilder.github.io/master/screens/gotoDefinition.gif)

# Find References

Easy as `Ctrl|⌘ + Shift + B`

![](https://raw.githubusercontent.com/TypeScriptBuilder/typescriptbuilder.github.io/master/screens/findReferences.gif)

# Active List

Going through your error list is a breeze with `F8` (goto next) and `Shift+F8` (goto previous).

![](https://raw.githubusercontent.com/TypeScriptBuilder/typescriptbuilder.github.io/master/screens/activeList.gif)
