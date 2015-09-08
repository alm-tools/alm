Some reasons that didn't make the cut for the home page : 
 * MultiMonitor: Just open a new tab!
 * Cause it was fun to do, and demos a lot of Tech in combination and I keep getting questions about how to do these in a neat workflow: `TypeScript`,`webpack`,`react`,`radium`. Checkout [contributing](./README.md) for technical details.
 * Wrote from scratch: As I looked at the Atom / Brackets code bases and didn't like quite a few things I saw (e.g. how brackets handles third party code, atom's usage of coffescript, neither written in TypeScript, neither supporting remote editing). 
 * More on remote editing: Dev setups are expensive. Its potentially a joy to work on your office machine from wherever.
 * Did I mention that I love TypeScript and really wanted to prove that *it provides a technical advantage that greatly increases developer efficiency*.
 * Provide you with a base editor that you can build internal projects on top of TypeScript with. The code editing experience should be top notch ... beyond this you can add stuff like WYSIWYG editors taking advantage of the full TypeScript language service.

# atom-typescript
 * We did some previous work on atom-typescript : Now atom is a *seriously* great project, but doing the kind of stuff we wanted to do was *too much modification of atom for a single plugin* e.g. : 
    * We want to highjack the tree view to hide build resources + highjack renaming to support code refactoring
    * Have our own error panel 
    * Intercept the symbol provider to show typescript project wide symbols
    * Have a background worker doing our analysis for us 
    * more ... 
    
Plus some things like a *build server* support doesn't seem like a valid thing to add as atom plugin.

Also an atom plugin should work *the way you want it to work*. This software will come with its own *strong* opinions to give a consistent workflow.