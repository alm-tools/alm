type NumStr = number|string;
/**
  * Basic placeholder based formatting like C# string.Format
  * ('{0} says {1}','la','ba' ) => 'la says ba'
  */
export function format(str: string, ...args: NumStr[]) {
    return str.replace(/{(\d+)}/g, function(m, i?) {
        return args[i] !== undefined ? args[i].toString() : m;
    });
}

export function localize(key: string, str: string, ...args: NumStr[]) {
    return format(str, ...args);
}
