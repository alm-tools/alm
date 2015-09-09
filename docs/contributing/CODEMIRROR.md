Our Editor is just a wrapper around codemirror.

# Docs 
https://codemirror.net/doc/manual.html 
https://codemirror.net/doc/manual.html#api

Various useful community addons : https://github.com/codemirror/CodeMirror/wiki/CodeMirror-addons 

Notes: 
 * Code mirror position `line` is zero based. So is `ch`.


# VS ACE
Reasons we went with codemirror
* sparse documentation
* not on NPM (at least officially, and come with a bunch of *webworkers* that are hard to integrate / remove)
* The CodeMirror dev is extremely friendly