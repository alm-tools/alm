# Requirements
* Latest Chrome
* Latest NodeJS

# Installation

Installation is super easy:

```bash
npm i alm -g
```

> TIP on mac / linux you might want to try `sudo npm i alm -g`.

# TypeScript Project
TypeScript projects are specified using a `tsconfig.json` file. If you don't have one we can create it for you just run

```bash
alm -i
```

# Start

Once you have the `tsconfig.json` (or if you already had one) you can start the editor using the following command from the directory that contains the project:

```bash
alm -o
```
> TIPs:
* `-p` flag can be used to provide a different path to `tsconfig.json`
* `-o` opens the browser window for you. Alternatively you can open the url that is logged on the console manually (something like http://localhost:4444)

# Using the editor

> One of the key goals of this editor is to make everything possible with just the keyboard.

Once you have the editor open you will be presented with a window like the following:

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/quickstart/1initial.png)

Now go ahead and open the [tree view][tree-view] with `Ctrl|⌘ + \`

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/quickstart/2tree.png)

> **TIP** Keyboard shortcut `Ctrl|⌘` means `Ctrl` on windows and `⌘` on Mac.

The tree view has quite a few features (you can press `h` to view its help when it is in focus) and one of them is (no surprise 🎉) **Add File**. Just tap `a` and you will be presented with a file add dialog.

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/quickstart/3addfile.png)

Just type in the filename and press *enter*. This will create the file and open it for you as shown.

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/quickstart/4filename.png)

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/quickstart/5created.png)

> TIP: `Ctrl|⌘ + \` will toggle the tree view open and close

Now go ahead and type in some code. Doesn't have to be good code. Here is some bad code:

```ts
var foo = 123;
foo = 'Hello World'
console.log(foo);
```

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/quickstart/6code.png)

You will notice that the TypeScript code intelligence / analysis will kick in. You can toggle the [error panel][errors] with `Ctrl|⌘ + ;` (just giving you a reason to type the `;` key)

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/quickstart/7errorpanel.png)

> TIP: You can cycle through project wide errors with `F8`. Remember we love the keyboard 🎹

I leave it to you to fix the error, or leave it as it is and move to your real world application.

# Next Steps

Don't forget to checkout [other features][features], **especially** [Omni Command Search][omni-search]

[tree-view]: /features/tree.md
[errors]: /features/errors.md
[omni-search]: /features/omni-search.md
[features]: /features/README.md
