# Layout management
We use the dockpanel and widget system from http://phosphorjs.github.io/

## Installing
Installing is done using:

```bash
npm install phosphor-dockpanel@latest --save-dev
npm install phosphor-widget@latest --save-dev
```
This makes sure we don't get duplicates.

## Setup
The phosphorjs layout needs to be the Root. A level above React. With react being used *inside* the components. This is the way [phosphide][phosphide] is setup with [applicationshell][applicationshell] being at the root.


[phosphide]: https://github.com/phosphorjs/phosphide
[applicationshell]: https://github.com/phosphorjs/phosphide/blob/master/src/core/applicationshell.ts
