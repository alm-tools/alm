# Some monaco docs

## Taking control of the cursor

Some functions
```ts
(editor:Editor) => editor['cursor'].trigger('jumpy','cursorLeft'),
(editor:Editor) => editor['cursor'].trigger('jumpy','cursorDown'),
(editor:Editor) => editor['cursor'].trigger('jumpy','cursorRight'),
(editor:Editor) => editor['cursor'].trigger('jumpy','cursorUp'),
```

## Completions Sorting 
In `Suggest.ts` : determines the overall sorting of completion items : https://github.com/Microsoft/vscode/blob/1889442ff090ef8170814a98698506300962dbba/src/vs/editor/contrib/suggest/common/suggest.ts#L142

Then in `completionModel.ts` `_createCachedState` : https://github.com/Microsoft/vscode/blob/1889442ff090ef8170814a98698506300962dbba/src/vs/editor/contrib/suggest/common/completionModel.ts#L110 filters these into `filteredItems`

`_createCachedState` also stores the `_topScoreIdx` and that is used to set the focus as the completion model comes up.