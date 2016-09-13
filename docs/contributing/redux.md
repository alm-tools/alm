# Using Redux

Redux is great for
* debugging
* keeping things consistent in the app

However its not written to be easily used by TypeScript. So we have [`simpleRedux.ts`](https://github.com/alm-tools/alm/blob/master/src/app/state/simpleRedux.ts). Usage should be fairly obvious and is documented below.

## One time stuff

(see [`state.ts`](https://github.com/alm-tools/alm/blob/master/src/app/state/state.ts)):

* define the store state interface
* define initial state
* create `store`.

## Creating a new action
The magic is the `add` function. You pass in a `reducer` ... and you get the `actionCreator` created for free.

The main gain : the `actionCreator` argument + `reducer -> state` transform is all type checked.

```ts
export let addTabs = redux.add('addTabs', (state:StoreState, tabs: TabInstance[]): StoreState => {
    tabs = state.tabs.concat(tabs);
    return {
        tabs
    };
});
```

## Creating a component
Define your props like :
```ts
export interface Props extends React.Props<any> {
    // from react-redux ... connected below
    errorsExpanded?: boolean;
}
```
And then connect your component:
```ts
@connect((state: StoreState): Props => {
    return {
        errorsExpanded: state.errorsExpanded,
    };
})
```

## Global state that comes from server
We setup such state in `main.tsx` basically setting it initially and updating it on new data recieved from server. e.g. The updated errors in the current project.

## More

If you are looking for using these ideas in your own projects, Daniel has been kind enough to write up a project that does more and in a more decoupled (multiple disconnected reducers) way:

* Docs http://danielearwicker.github.io/Immuto_Strongly_Typed_Redux_Composition.html
* Library https://github.com/danielearwicker/immuto
