# Autocomplete

Having a great autocomplete experience is at the heart of the design goals for TypeScript. Hopefully you find the autocomplete behaviours in alm better than the rest.

## Aggressive
We have an aggressive autocomplete i.e. it should show up by itself whenever it makes sense. You can always trigger it explicitly with `Ctrl + Space`.

## Snippets
Snippets are at the heart of a great autocomplete experience. We provide snippets for common TypeScript constructs e.g. here is an `if` snippet in action:

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/autocomplete/snippetBasic.gif)

You cycle through the snippet options with `Tab`, e.g. here is a `forof` snippet

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/autocomplete/snippetAdvanced.gif)

Once you are happy with the snippet outcome just press `Enter`. In fact you can press enter at any time and we take you to a desirable *final location*, e.g. here you can chose to not provide an alternate name for `item`:

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/autocomplete/snippetAbort.gif)

## Functions
For functions we provide signature completions. Just select the one you want.

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/autocomplete/function.gif)

## Path Completions
We provide file path completions so you can use TypeScript modules without an significant disruption to your workflow.

* ES6 Modules (snippet: `import`)

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/autocomplete/es.gif)

* ES6 with destructuring (snippet: `import`)

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/autocomplete/destructure.gif)

* CommonJS style traditional `import/require`:

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/autocomplete/commonjs.gif)
