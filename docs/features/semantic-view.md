# Semantic View

> Command Search : Toggle Semantic View

Gives a quick overview of the contents of a file. Useful when you are dealing with large complex files.

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/semanticView/basic.png)

You can click on a node in the view to go to its position in the file.

The semantic view highlights your cursor position within the file.

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/semanticView/followCursor.gif)

It also live updates as you edit the file.

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/semanticView/live.gif)

## Explanation of cursor position
The view is designed so that
* You don't need to keep expanding collapsing nodes just to make a sense of the whole file
* At any given point you know where you are *with respect to your siblings*.

Consider the following:

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/semanticView/explain.png)

Here you are actually currently viewing:
```ts
ts.NavigationBar
  getNavigationBarItems
    createTopLevelItem
      createSourceFileItem
```
But you did not need to *collapse* or *expand* any views to see that.

Additionally you know stuff like the root `ts.NavigationBar` module in the file has two children (`getNavigationBarItems` and `getJsNavigationBarItems`).
