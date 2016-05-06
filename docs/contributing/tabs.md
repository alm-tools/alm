# Tabs
We use golden-layout. All the tab management is done by a single [`appTabsContainer`][code] container.

* Getting Started : https://www.golden-layout.com/tutorials/getting-started.html (simpler for us because we use webpack + npm module)
* Examples : https://www.golden-layout.com/examples/

## ReactJS Support
Excellent ReactJS support. You can register react components with the same API as all other components (`layout.registerComponent`). But in the configuration you specify the type to be `react-component`. You also get to provide additional `props` to the component. Checkout the `Simple ReactJS example` in the examples.

## Tips from official docs
* Configure the layout: https://golden-layout.com/docs/Config.html
* Configure the items: https://golden-layout.com/docs/ItemConfig.html
* Adding items after initialize: https://golden-layout.com/tutorials/dynamically-adding-components.html

## Some notes
* Initially we just make a stack at the root and then add tabs to it.

## Row vs. column
The following are rows in golden-layout lingo:

```
a b c
```
The following are columns
```
a
b
c
```

[code]:https://github.com/alm-tools/alm/blob/master/src/app/tabs/v2/appTabsContainer.tsx
