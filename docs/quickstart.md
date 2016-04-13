# Installation

Installation is super easy. If you have nodejs / npm on your path all you need to do is:

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
