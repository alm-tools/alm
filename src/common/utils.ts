export function log() {
    console.log('log');
}

type MapKey = string|number;
type MapableArray = MapKey[];
/**
 * Create a quick lookup map from list
 */
export function createMap(arr: MapableArray): { [string: string]: boolean;[number: number]: boolean } {
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

export function getFileName(fullFilePath:string){
    let parts = fullFilePath.split('/');
    return parts[parts.length - 1];
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
    return url && url.length > 'file://'.length ? url.substr('file://'.length): '';
}
