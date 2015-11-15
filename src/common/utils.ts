export function log() {
    console.log('log');
}

type MapKey = string|number;
type MapableArray = MapKey[];
export type TruthTable = { [string: string]: boolean;[number: number]: boolean };
/**
 * Create a quick lookup map from list
 */
export function createMap(arr: MapableArray): TruthTable {
    return arr.reduce((result: { [string: string]: boolean }, key: string) => {
        result[key] = true;
        return result;
    }, <{ [string: string]: boolean }>{});
}

/**
 * Create a quick lookup map from list
 */
export function createMapByKey<K extends MapKey,V>(arr: V[], getKey:(item:V)=>K): { [key:string]: V[]; [key:number]: V[]} {
    var result: any = {};
    arr.forEach(item => {
        let key: any = getKey(item);
        result[key] = result[key] ? result[key].concat(item) : [item];
    })
    return result;
}

/** Sloppy but effective code to find distinct */
export function distinct(arr: string[]): string[] {
    var map = createMap(arr);
    return Object.keys(map);
}

/**
 * Debounce
 */
var now = () => new Date().getTime();
export function debounce<T extends Function>(func: T, milliseconds: number, immediate = false): T {
    var timeout, args, context, timestamp, result;

    var wait = milliseconds;

    var later = function() {
        var last = now() - timestamp;

        if (last < wait && last > 0) {
            timeout = setTimeout(later, wait - last);
        } else {
            timeout = null;
            if (!immediate) {
                result = func.apply(context, args);
                if (!timeout) context = args = null;
            }
        }
    };

    return <any>function() {
        context = this;
        args = arguments;
        timestamp = now();
        var callNow = immediate && !timeout;
        if (!timeout) timeout = setTimeout(later, wait);
        if (callNow) {
            result = func.apply(context, args);
            context = args = null;
        }

        return result;
    };
};

export function throttle<T extends Function>(func: T, milliseconds: number, options?: { leading?: boolean; trailing?: boolean }) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    let gnow = now;
    var later = function() {
        previous = options.leading === false ? 0 : gnow();
        timeout = null;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
    };
    return function() {
        var now = gnow();
        if (!previous && options.leading === false) previous = now;
        var remaining = milliseconds - (now - previous);
        context = this;
        args = arguments;
        if (remaining <= 0 || remaining > milliseconds) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            previous = now;
            result = func.apply(context, args);
            if (!timeout) context = args = null;
        } else if (!timeout && options.trailing !== false) {
            timeout = setTimeout(later, remaining);
        }
        return result;
    };
};

export function once<T extends Function>(func: T): T {
    let ran = false;
    let memo = undefined;
    return function() {
        if (ran) return memo;
        ran = true;
        memo = func.apply(this, arguments);
        func = null;
        return memo;
    } as any;
}

export function rangeLimited(args: { num: number, min: number, max: number, loopAround?: boolean }) {
    let {num, min, max, loopAround} = args;
    var limited = Math.max(Math.min(num, max), min);
    if (loopAround && limited > num){
        return max;
    }
    if (loopAround && limited < num){
        return min;
    }
    return limited;
}

/** `/asdf/bar/j.ts` => `j.ts` */
export function getFileName(fullFilePath:string){
    let parts = fullFilePath.split('/');
    return parts[parts.length - 1];
}

/** `/asdf/bar/j.ts` => `/asdf/bar` */
export function getDirectory(filePath: string): string {
    let directory = filePath.substring(0, filePath.lastIndexOf("/"));
    return directory;
}

/** Folder + filename only e.g. `/asdf/something/tsconfig.json` => `something/tsconfig.json` */
export function getDirectoryAndFileName(filePath:string): string {
    let directoryPath = getDirectory(filePath);
    let directoryName = getFileName(directoryPath);
    let fileName = getFileName(filePath);
    return `${directoryName}/${fileName}`;
}

/**
 * shallow equality of sorted arrays
 */
export function arraysEqual<T>(a: T[], b: T[]): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

/** Creates a Guid (UUID v4) */
export function createId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
/** Creates a Guid (UUID v4) */
export var createGuid = createId;

// Not optimized
export function selectMany<T>(arr: T[][]): T[] {
    var result = [];
    for (var i = 0; i < arr.length; i++) {
        for (var j = 0; j < arr[i].length; j++) {
            result.push(arr[i][j]);
        }
    }
    return result;
}

/** Lots of things don't have a good error. But we would like to be consistent even with simple errors */
export function makeBlandError(filePath: string, error: string): CodeError {
    return {
        filePath,
        from: {
            line: 0,
            ch: 0
        },
        to: {
            line: 0,
            ch: 0
        },
        message: error,
        preview: null
    }
}

/** From `file://filePath` to `filePath` */
export function getFilePathFromUrl(url: string) {
    let {filePath} = getFilePathAndProtocolFromUrl(url);
    return filePath;
}

/** We consistently have tabs with protocol + filePath */
export function getFilePathAndProtocolFromUrl(url: string): {protocol: string; filePath:string}{
    // TODO: error handling
    let protocol = url.substr(0,url.indexOf('://'));
    let filePath = url.substr((protocol + '://').length);
    return {protocol, filePath};
}
export function getUrlFromFilePathAndProtocol(config:{protocol:string,filePath:string}){
    return config.protocol + '://' + config.filePath;
}

/**
 * Promise.resolve is something I call the time (allows you to take x|promise and return promise ... aka make sync prog async if needed)
 */
export var resolve: typeof Promise.resolve = Promise.resolve.bind(Promise);

/** Useful for various editor related stuff e.g. completions */
var punctuations = createMap([';', '{', '}', '(', ')', '.', ':', '<', '>', "'", '"']);
/** Does the prefix end in punctuation */
export var prefixEndsInPunctuation = (prefix: string) => prefix.length && prefix.trim().length && punctuations[prefix.trim()[prefix.trim().length - 1]];

/** String based enum pattern */
export function stringEnum(x){
    // make values same as keys
    Object.keys(x).map((key) => x[key] = key);
}
