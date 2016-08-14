# CSS

We try to use as little CSS as possible but when using third party libraries sometimes the only way to customize them is with CSS. We use webpack `require` to load such CSS files.

# Z-Index
Because we have this distributed between TS / CSS files we document these here:

* Golden-Layout: 2 (in `appTabsContainer.css`)
* Main Panel : 6 (`mainPanel.ts`)
* Modal Overlay: 100 (in `index.html`)
* File Tree View: 6 (`fileTree.tsx`)
* Doctor : 1 (`doctor.tsx`)

# Background color
Whenever possible prefer the Editor background color.

* You don't need it explicitly at the root components as we have it setup for `GoldenLayout` (in `appTabsContainer.css`) as well as `body` (in `index.html` as a style attribute)

* tips.tsx (in `appTabsContainer.css`).

# FStyle

We use free-style to manage our CSS in JS (TS). Just a bit of naming convention:

* `**ClassName` : must be used in `className=` attribute
* `**Base` : must be used to make a `ClassName`.
* `**Style`: can be used to make a `ClassName` or directly in a style.
