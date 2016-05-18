# CSS

We try to use as little CSS as possible but when using third party libraries sometimes the only way to customize them is with CSS. We use webpack `require` to load such CSS files.

# Z-Index
Because we have this distributed between TS / CSS files we document these here:

* CodeMirror : 2 (in their own css)
* Golden-Layout: 5 (in `appTabsContainer.css`)
* Main Panel : 6 (`mainPanel.ts`)
* Modal Overlay: 100 (in `index.html`)
* File Tree View: 6 (`fileTree.tsx`)

# Background color
Whenever possible prefer the CodeMirror background color. You don't need it explicitly at the root components as we have it setup for `GoldenLayout` (`appTabsContainer.css`) as well as `#root`.
