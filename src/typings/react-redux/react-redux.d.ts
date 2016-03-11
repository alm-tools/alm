// Type definitions for react-redux
// Project: https://github.com/rackt/react-redux
// Definitions by: Basarat <https://github.com/basarat/>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

declare module "react-redux" {
    import React = require('react');

    export interface ProviderProps {
        store: any;
        /**
         *   Unlike most React components, <Provider> accepts a function as a child with your root component
         *   <Provider store={store}>
         *      {() => <MyRootComponent />}
         *   </Provider>
         */
    }

    export class Provider extends React.Component<ProviderProps, any>{
    }

    export function connect(
        /** If specified, the component will subscribe to Redux store updates. Any time it updates, mapStateToProps will be called. Its result must be a plain object, and it will be merged into the component’s props. If you omit it, the component will not be subscribed to the Redux store. If ownProps is specified as a second argument, then mapStateToProps will be re-invoked whenever the component receives new props. */
        mapStoreStateToProps?: Function,
        /** If an object is passed, each function inside it will be assumed to be a Redux action creator. An object with the same function names, but bound to a Redux store, will be merged into the component’s props. If a function is passed, it will be given dispatch. It’s up to you to return an object that somehow uses dispatch to bind action creators in your own way. (Tip: you may use the bindActionCreators() helper from Redux.) If you omit it, the default implementation just injects dispatch into your component’s props. If ownProps is specified as a second argument, then mapDispatchToProps will be re-invoked whenever the component receives new props. */
        mapDispatchToProps?: Object | Function,
        /** If specified, it is passed the result of mapStateToProps(), mapDispatchToProps(), and the parent props. The plain object you return from it will be passed as props to the wrapped component. You may specify this function to select a slice of the state based on props, or to bind action creators to a particular variable from props. If you omit it, Object.assign({}, ownProps, stateProps, dispatchProps) is used by default. */
        mergeProps?: Function,
        /** If specified, further customizes the behavior of the connector. */
        options?: {
            /** Defaults to true */
            pure: boolean
        }): {
            <TComponent>(t: TComponent): TComponent
        }
}
