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
