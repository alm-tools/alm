/**
 * Golden Layout
 */

declare namespace GoldenLayout {

    export type ItemConfigType = ItemConfig | ComponentConfig | ReactComponentConfig;

    export interface Settings {
        /**
         * Turns headers on or off. If false, the layout will be displayed with splitters only.
         * Default: true
         */
        hasHeaders?: boolean;

        /**
         * Constrains the area in which items can be dragged to the layout's container. Will be set to false
         * automatically when layout.createDragSource() is called.
         * Default: true
         */
        constrainDragToContainer?: boolean;

        /**
         * If true, the user can re-arrange the layout by dragging items by their tabs to the desired location.
         * Default: true
         */
        reorderEnabled?: boolean;

        /**
         * If true, the user can select items by clicking on their header. This sets the value of layout.selectedItem to
         * the clicked item, highlights its header and the layout emits a 'selectionChanged' event.
         * Default: false
         */
        selectionEnabled?: boolean;

        /**
         * Decides what will be opened in a new window if the user clicks the popout icon. If true the entire stack will
         * be transferred to the new window, if false only the active component will be opened.
         * Default: false
         */
        popoutWholeStack?: boolean;

        /**
         * Specifies if an error is thrown when a popout is blocked by the browser (e.g. by opening it programmatically).
         * If false, the popout call will fail silently.
         * Default: true
         */
        blockedPopoutsThrowError?: boolean;

        /**
         * Specifies if all popouts should be closed when the page that created them is closed. Popouts don't have a
         * strong dependency on their parent and can exist on their own, but can be quite annoying to close by hand. In
         * addition, any changes made to popouts won't be stored after the parent is closed.
         * Default: true
         */
        closePopoutsOnUnload?: boolean;

        /**
         * Specifies if the popout icon should be displayed in the header-bar.
         * Default: true
         */
        showPopoutIcon?: boolean;

        /**
         * Specifies if the maximise icon should be displayed in the header-bar.
         * Default: true
         */
        showMaximiseIcon: boolean;

        /**
         * Specifies if the close icon should be displayed in the header-bar.
         * Default: true
         */
        showCloseIcon: boolean;
    }

    export interface Dimensions {
        /**
         * The width of the borders between the layout items in pixel. Please note: The actual draggable area is wider
         * than the visible one, making it safe to set this to small values without affecting usability.
         * Default: 5
         */
        borderWidth?: number;

        /**
         * The minimum height an item can be resized to (in pixel).
         * Default: 10
         */
        minItemHeight?: number;

        /**
         * The minimum width an item can be resized to (in pixel).
         * Default: 10
         */
        minItemWidth?: number;

        /**
         * The height of the header elements in pixel. This can be changed, but your theme's header css needs to be
         * adjusted accordingly.
         * Default: 20
         */
        headerHeight?: number;

        /**
         * The width of the element that appears when an item is dragged (in pixel).
         * Default: 300
         */
        dragProxyWidth?: number;

        /**
         * The height of the element that appears when an item is dragged (in pixel).
         * Default: 200
         */
        dragProxyHeight?: number;
    }

    export interface Labels {
        /**
         * The tooltip text that appears when hovering over the close icon.
         * Default: 'close'
         */
        close?: string;

        /**
         * The tooltip text that appears when hovering over the maximise icon.
         * Default: 'maximise'
         */
        maximise?: string;

        /**
         * The tooltip text that appears when hovering over the minimise icon.
         * Default: 'minimise'
         */
        minimise?: string;

        /**
         * The tooltip text that appears when hovering over the popout icon.
         * Default: 'open in new window'
         */
        popout?: string;
    }

    export interface ItemConfig {
        /**
         * The type of the item. Possible values are 'row', 'column', 'stack', 'component' and 'react-component'.
         */
        type: string;

        /**
         * An array of configurations for items that will be created as children of this item.
         */
        content?: ItemConfigType[];

        /**
         * The width of this item, relative to the other children of its parent in percent
         */
        width?: number;

        /**
         * The height of this item, relative to the other children of its parent in percent
         */
        height?: number;

        /**
         * A String or an Array of Strings. Used to retrieve the item using item.getItemsById()
         */
        id?: string | string[];

        /**
         * Determines if the item is closable. If false, the x on the items tab will be hidden and container.close()
         * will return false
         * Default: true
         */
        isClosable?: boolean;

        /**
         * The title of the item as displayed on its tab and on popout windows
         * Default: componentName or ''
         */
        title?: string;
    }

    export interface ComponentConfig extends ItemConfig {
        /**
         * The name of the component as specified in layout.registerComponent. Mandatory if type is 'component'.
         */
        componentName: string;

        /**
         * A serialisable object. Will be passed to the component constructor function and will be the value returned by
         * container.getState().
         */
        componentState?: any;
    }

    export interface ReactComponentConfig extends ItemConfig {
        /**
         * The name of the component as specified in layout.registerComponent. Mandatory if type is 'react-component'
         */
        component: string;

        /**
         * Properties that will be passed to the component and accessible using this.props.
         */
        props?: any;
    }

    export interface Config {
        settings?: Settings;
        dimensions?: Dimensions;
        labels?: Labels;
        content: ItemConfigType[];
    }

    export interface ContentItem {
        /**
         * This items configuration in its current state
         */
        config: ItemConfigType

        /**
         * The type of the item. Can be row, column, stack, component or root
         */
        type: string;

        /**
         * An array of items that are children of this item
         */
        contentItems: ContentItem[];

        /**
         * The item that is this item's parent (or null if the item is root)
         */
        parent: ContentItem;

        /**
         * A String or array of identifiers if provided in the configuration
         */
        id: string;

        /**
         * True if the item had been initialised
         */
        isInitialised: boolean;

        /**
         * True if the item is maximised
         */
        isMaximised: boolean;

        /**
         * True if the item is the layout's root item
         */
        isRoot: boolean;

        /**
         * True if the item is a row
         */
        isRow: boolean;

        /**
         * True if the item is a column
         */
        isColumn: boolean;

        /**
         * True if the item is a stack
         */
        isStack: boolean;

        /**
         * True if the item is a component
         */
        isComponent: boolean;

        /**
         * A reference to the layoutManager that controls this item
         */
        layoutManager: any;

        /**
         * The item's outer element
         */
        element: any;

        /**
         * The item's inner element. Can be the same as the outer element.
         */
        childElementContainer: Container;

        /**
         * Only Stacks have this method! It's the programmatical equivalent of clicking a tab.
         * @param contentItem The new active content item
         */
        setActiveContentItem(contentItem: ContentItem): void;

        /**
         * Returns all items with the specified id.
         * @param id An id specified in the itemConfig
         */
        getItemsById(id: string | string[]): ContentItem[];

    }

    export interface Container extends EventEmitter {
        /**
         * The current width of the container in pixel
         */
        width: number;

        /**
         * The current height of the container in pixel
         */
        height: number;
    }

    export interface BrowserWindow {

    }

    export interface EventEmitter {
        /**
         * Subscribe to an event
         * @param eventName The name of the event to describe to
         * @param callback The function that should be invoked when the event occurs
         * @param context The value of the this pointer in the callback function
         */
        on(eventName: string, callback: Function, context?: any): void;

        /**
         * Notify listeners of an event and pass arguments along
         * @param eventName The name of the event to emit
         */
        emit(eventName: string, arg1?: any, arg2?: any, ...argN: any[]): void;

        /**
         * Alias for emit
         */
        trigger(eventName: string, arg1?: any, arg2?: any, ...argN: any[]): void;

        /**
         * Unsubscribes either all listeners if just an eventName is provided, just a specific callback if invoked with
         * eventName and callback or just a specific callback with a specific context if invoked with all three
         * arguments.
         * @param eventName The name of the event to unsubscribe from
         * @param callback The function that should be invoked when the event occurs
         * @param context The value of the this pointer in the callback function
         */
        unbind(eventName: string, callback?: Function, context?: any): void;

        /**
         * Alias for unbind
         */
        off(eventName: string, callback?: Function, context?: any): void;
    }
}
