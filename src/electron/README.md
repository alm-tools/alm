## Can you make this into an electron executable

Shipping binary `nodejs` + `chrome` to a user system which already has these things feels bad especially if we don't use it in any special way. `npm install alm -g` is actually an easier / quicker install, goes everywhere I do. But don't let us stop you from making your own editor executable. Here's how :rose:


# What's here
Our main app is just a nodejs server app that serves all that is needed just to a `url` (that you can open in chrome).

However if you want a desktop executable we can support that quite easily using electron (nodejs + chrome) by just running our node.js app and then creating a view to the `url`. This application can actually be completely seperate from the other one and that is what's happening here.

## Using it

```
npm install electron-prebuilt -g
```

And from this folder

```
electron .
```

