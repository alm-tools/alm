# Quick Fix
A light blub shows up if a quick fix is available. Trigger the `Quick Fix` command (use command search OR click on bulb OR use shortcut `alt+enter`) to see quick fixes. Select the quick fix you want and press `enter` to commit. Example quick fixes

## Add class and interface members

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/quickFix/addClassMember.gif)

## Type assert
Insert type assertions on property access for easier migration from JS code

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/quickFix/typeAssert.gif)


## Toggle quote characters

Single to double, double to single

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/quickFix/quotesToQuotes.gif)

## Quotes to template
Convert strings to template strings to get rid of those `\`

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/quickFix/quotesToTemplate.gif)

## String concat to template
Convert string concatenations to a template string

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/quickFix/stringConcatToTemplate.gif)

## Equals to Equals
`==` and `!=` (because typing another `=` is hard)

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/quickFix/equalsToEquals.gif)

## Import file
If an error can be fixed by importing a module

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/quickFix/addImportStatement.gif)


## Single Line Comment To JsDoc
JsDoc are associated with the next node. Single line comments are not. So this quickfix does the conversion for you

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/quickFix/singleLineCommentToJsdoc.gif)


# Contributing

[We have some guidance on creating your own quickfixes](/contributing/quickfix.md). They are quite fun to write!
