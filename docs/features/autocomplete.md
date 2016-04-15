# Autocomplete

Having a great autocomplete experience is at the heart of the design goals for TypeScript. Hopefully you find the autocomplete behaviours in alm better than the rest.

> We have an aggressive autocomplete i.e. it should show up by itself whenever it makes sense. You can always trigger it explicitly with `Ctrl + Space`.

## Snippets
Snippets are at the heart of a great autocomplete experience. We provide snippets for common TypeScript constructs e.g. here is an `if` snippet in action:

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/autocomplete/snippetBasic.gif)

You cycle through the snippet options with **`Tab`**, e.g. here is a `forof` snippet

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/autocomplete/snippetAdvanced.gif)

Once you are happy with the snippet outcome just press **`Enter`** and we take you to a *desirable final location*, e.g. here we chose to stick with default name `item`:

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/autocomplete/snippetAbort.gif)

> TIP : You can also press `Esc` to exit the snippet mode without actually jumping to *desirable final location* cursor location.

## Functions
For functions we provide signature completions. Just select the one you want.

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/autocomplete/function.gif)

## Path Completions
We provide file path completions so you can use TypeScript modules without an significant disruption to your workflow.

#### ES6 Modules (snippet: `import`)

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/autocomplete/es.gif)

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/autocomplete/destructure.gif)

#### CommonJS style (snippet: `importr`)

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/autocomplete/commonjs.gif)
