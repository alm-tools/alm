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

/**
 * Turns keys into values and values into keys
 */
export function reverseKeysAndValues(obj: { [key: string]: string }): { [key: string]: string } {
    var toret = {};
    Object.keys(obj).forEach(function(key) {
        toret[obj[key]] = key;
    });
    return toret;
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

/**
 * Like debounce but will also call if a state change is significant enough to not ignore silently
 */
export function triggeredDebounce<Arg>(config:{
    func: (arg:Arg)=>void,
    mustcall: (newArg:Arg,oldArg:Arg)=>boolean,
    milliseconds: number}): (arg:Arg) => void {
    let lastArg, lastCallTimeStamp, hasALastArg = false;
    let pendingTimeout = null;

    const later = function() {
        const timeSinceLast = now() - lastCallTimeStamp;

        if (timeSinceLast < config.milliseconds) {
            if (pendingTimeout) {
                clearTimeout(pendingTimeout);
                pendingTimeout = null;
            }
            pendingTimeout = setTimeout(later, config.milliseconds - timeSinceLast);
        } else {
            config.func(lastArg);
        }
    };

    return function(arg:Arg) {
        const stateChangeSignificant = hasALastArg && config.mustcall(arg,lastArg);
        if (stateChangeSignificant) {
            config.func(lastArg);
        }
        lastArg = arg;
        hasALastArg = true;

        lastCallTimeStamp = now();
        later();
    };
};

export function throttle<T extends Function>(func: T, milliseconds: number, options?: { leading?: boolean; trailing?: boolean }): T {
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
    } as any;
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

/** is file path a ts file path */
export function isTsFile(filePath: string): boolean {
    let ext = getExt(filePath);
    return ext == 'ts' || ext == 'tsx';
}

/** `/asdf/bar/j.ts` => `ts` */
export function getExt(filePath: string) {
    let parts = filePath.split('.');
    return parts[parts.length - 1].toLowerCase();
}

/**
 * asdf/asdf:123 => asdf/asdf + 122
 * Note: returned line is 0 based
 */
export function getFilePathLine(query: string) {
    let [filePath,lineNum] = query.split(':');
    let line = lineNum ? parseInt(lineNum) - 1 : 0;
    line = line > 0 ? line : 0;
    return { filePath, line };
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

/** Just adds your intercept function to be called whenever the original function in called */
export function intercepted<T extends Function>(config: {context:any;orig:T;intercept:T}):T{
    return function(){
        config.intercept.apply(null, arguments);
        return config.orig.apply(config.context,arguments);
    } as any;
}

/**
 * path.relative for browser
 * from : https://github.com/substack/path-browserify/blob/master/index.js
 * but modified to not depened on `path.resolve` as from and to are already resolved in our case
 */
export const relative = function(from:string, to:string) {
    function trim(arr) {
        var start = 0;
        for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
        }

        var end = arr.length - 1;
        for (; end >= 0; end--) {
            if (arr[end] !== '') break;
        }

        if (start > end) return [];
        return arr.slice(start, end - start + 1);
    }

    var fromParts = trim(from.split('/'));
    var toParts = trim(to.split('/'));

    var length = Math.min(fromParts.length, toParts.length);
    var samePartsLength = length;
    for (var i = 0; i < length; i++) {
        if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
        }
    }

    var outputParts = [];
    for (var i = samePartsLength; i < fromParts.length; i++) {
        outputParts.push('..');
    }

    outputParts = outputParts.concat(toParts.slice(samePartsLength));

    return outputParts.join('/');
};

let imageExtensions = ['png','gif','svg','jpg','jpeg','bmp'];
export function isImage(url:string){
    return imageExtensions.some(ext => url.endsWith("." + ext));
}

/**
 * Great for find and replace
 */
export function findOptionsToQueryRegex(options: { query: string, isRegex: boolean, isFullWord: boolean, isCaseSensitive: boolean }): RegExp {
    // Note that Code mirror only takes `query` string *tries* to detect case senstivity, regex on its own
    // So simpler if we just convert options into regex, and then code mirror will happy use the regex as is
    let str = options.query;
    var query: RegExp;

    /** This came from search.js in code mirror */
    let defaultQuery = /x^/;

    if (!options.isRegex){
        // from CMs search.js
        str = str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }
    if (options.isFullWord){
        str = `\\b${str}\\b`;
    }
    try {
        query = new RegExp(str, options.isCaseSensitive ? "g" : "gi");
    }
    catch (e) {
        query = defaultQuery;
    }
    if (query.test("")){
        query = defaultQuery;
    }
    return query;
}

/**
 * Quick and dirty pad left
 */
export function padLeft(str: string, paddingValue: number) {
    let pad = '                                       ';
    return pad.substring(0, paddingValue - str.length) + str;
}

/**
 * Quick and dirty shallow extend
 */
export function extend<A>(a: A): A;
export function extend<A, B>(a: A, b: B): A & B;
export function extend<A, B, C>(a: A, b: B, c: C): A & B & C;
export function extend<A, B, C, D>(a: A, b: B, c: C, d: D): A & B & C & D;
export function extend(...args: any[]): any {
    const newObj = {};
    for (const obj of args) {
        for (const key in obj) {
            //copy all the fields
            newObj[key] = obj[key];
        }
    }
    return newObj;
};
