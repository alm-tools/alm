## Helping All TypeScript Developers
Wanted to create something that would help all TypeScript developers, all they need is NodeJS (which they already have because of `npm install typescript -g`). We have experience in writing solutions (e.g. cyclic analysis, dependency viewer, AST visualizer) that we want to share with *everyone* not just people that *use a particular IDE*.

## Remote editing (uses the browser)
* Works the same on the *server* as your local file system. Remote editing FTW!
* Heck..you can check in the IDE as a `devDependency`!
* Like cloud9 ... but on your server!
* MultiMonitor: Just open a new tab!
* Dev setups are expensive. Its potentially a joy to work on your office machine from wherever.

## TypeScript ❤
* Cause it was fun to do, and demos a lot of Tech in combination and I keep getting questions about how to do these in a neat workflow: `TypeScript`,`webpack`,`react`,`radium`, `redux` (flux). Checkout [contributing](./README.md) for technical details.
* Wrote from scratch: As I looked at the Atom / Brackets code bases and didn't like quite a few things I saw (e.g. how brackets handles third party code, atom's usage of coffescript, neither written in TypeScript, neither supporting remote editing).
* Did I mention that I love TypeScript and really wanted to prove that *it provides a technical advantage that greatly increases developer efficiency*.
* Provide you with a base editor that you can build internal projects on top of TypeScript with. The code editing experience should be top notch ... beyond this you can add stuff like WYSIWYG editors taking advantage of the full TypeScript language service.
* Having a TypeScript first IDE means I have more *keyboard shortcut space* available specific for TypeScript.

## atom-typescript
We did some previous work on atom-typescript : Now atom is a *seriously* great project and in fact is the editor I am using to write this doc, but doing the kind of stuff I wanted to do can be *too much modification of atom for a single plugin*.
