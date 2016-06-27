# Some monaco docs

## Taking control of the cursor

Some functions
```ts
(editor:Editor) => editor['cursor'].trigger('jumpy','cursorLeft'),
(editor:Editor) => editor['cursor'].trigger('jumpy','cursorDown'),
(editor:Editor) => editor['cursor'].trigger('jumpy','cursorRight'),
(editor:Editor) => editor['cursor'].trigger('jumpy','cursorUp'),
```
