Some reasons that didn't make the cut for the home page : 
 * Cause it was fun to do, and demos a lot of Tech in combination and I keep getting questions about how to do these in a neat workflow: `TypeScript`,`webpack`,`react`,`radium`. 

# atom-typescript
 * We did some previous work on atom-typescript : Now atom is a *seriously* great project, but doing the kind of stuff we wanted to do was *too much modification of atom for a single plugin* e.g. : 
    * We want to highjack the tree view to hide build resources + highjack renaming to support code refactoring
    * Have our own error panel 
    * Intercept the symbol provider to show typescript project wide symbols
    * Have a background worker doing our analysis for us 
    * more ... 
    
Plus some things like a *build server* support doesn't seem like a valid thing to add as atom plugin.

Also an atom plugin should work *the way you want it to work*. This software will come with its own *strong* opinions to give a consistent workflow.