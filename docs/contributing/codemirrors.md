Our Editor is just a wrapper around codemirror.

# Docs
https://codemirror.net/doc/manual.html
https://codemirror.net/doc/manual.html#api

Various useful community addons : https://github.com/codemirror/CodeMirror/wiki/CodeMirror-addons

Notes:
 * Code mirror position `line` is zero based. So is `ch`.

# Position vs Index
Quite commonly we need a zero based *string* index into the file. Codemirror has functions `indexFromPos` and `posFromIndex`. Warning : internally cm only tracks lines, so calling these loops (slowly) through relevant lines so be careful.

# Selecting
```
cm.setSelection(cursor.from(), cursor.to());
```

# Scroll into view
```
cm.scrollIntoView({from: cursor.from(), to: cursor.to()});
```


## VS ACE
Reasons we went with codemirror
* sparse documentation
* not on NPM (at least officially, and come with a bunch of *webworkers* that are hard to integrate / remove)
* The CodeMirror dev is extremely friendly
