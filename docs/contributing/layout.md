# Layout management
We use golden-layout.

* Getting Started : https://www.golden-layout.com/tutorials/getting-started.html (simpler for us because we use webpack + npm module)
* Examples : https://www.golden-layout.com/examples/

## ReactJS Support
Excellent ReactJS support. You can register react components with the same API as all other components (`layout.registerComponent`). But in the configuration you specify the type to be `react-component`. You also get to provide additional `props` to the component. Checkout the `Simple ReactJS example` in the examples.

## Adding tabs after initialize
Covered here : https://golden-layout.com/tutorials/dynamically-adding-components.html

We just make a stack at the root and then add tabs to it.
