## Can you make this into an electron executable

Shipping binary `nodejs` + `chrome` to a user system which already has these things feels bad. `npm install alm -g` is actually an easier install / quicker install / goes everywhere I do / allows you to run it on your own server / allows you to use it on portable devices (e.g rasberry pi) / helps you embed this editor if you want to.

But don't let us stop you from making your own editor executable. Here's how 🌹

# What's here
Our main app is just a nodejs server app that serves all that is needed to a `url` (that you can open in chrome).

So if you want a desktop executable we can support that quite easily using electron (nodejs + chrome) by just running our node.js app and then creating a view to the `url`. That is all what's happening here.

## Using it

```
npm install electron-prebuilt -g
```

And from this folder

```
electron .
```

## More Ideas

You can even use `alm` embedded into any `electron` environment. All you essentially need to do is to start `alm` (electron node) from some working dir and then open a browser window (electron chrome) at the dashboard url.
