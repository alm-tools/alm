export function createRegExp(searchString: string, isRegex: boolean, matchCase: boolean, wholeWord: boolean, global: boolean): RegExp {
    if (searchString === '') {
        throw new Error('Cannot create regex from empty string');
    }
    if (!isRegex) {
        searchString = searchString.replace(/[\-\\\{\}\*\+\?\|\^\$\.\,\[\]\(\)\#\s]/g, '\\$&');
    }
    if (wholeWord) {
        if (!/\B/.test(searchString.charAt(0))) {
            searchString = '\\b' + searchString;
        }
        if (!/\B/.test(searchString.charAt(searchString.length - 1))) {
            searchString = searchString + '\\b';
        }
    }
    let modifiers = '';
    if (global) {
        modifiers += 'g';
    }
    if (!matchCase) {
        modifiers += 'i';
    }

    return new RegExp(searchString, modifiers);
}

/**
 * Create a regular expression only if it is valid and it doesn't lead to endless loop.
 */
export function createSafeRegExp(searchString: string, isRegex: boolean, matchCase: boolean, wholeWord: boolean): RegExp {
    if (searchString === '') {
        return null;
    }

    // Try to create a RegExp out of the params
    var regex: RegExp = null;
    try {
        regex = createRegExp(searchString, isRegex, matchCase, wholeWord, true);
    } catch (err) {
        return null;
    }

    // Guard against endless loop RegExps & wrap around try-catch as very long regexes produce an exception when executed the first time
    try {
        if (regExpLeadsToEndlessLoop(regex)) {
            return null;
        }
    } catch (err) {
        return null;
    }

    return regex;
}


export function regExpLeadsToEndlessLoop(regexp: RegExp): boolean {
	// Exit early if it's one of these special cases which are meant to match
	// against an empty string
	if (regexp.source === '^' || regexp.source === '^$' || regexp.source === '$') {
		return false;
	}

	// We check against an empty string. If the regular expression doesn't advance
	// (e.g. ends in an endless loop) it will match an empty string.
	let match = regexp.exec('');
	return (match && <any>regexp.lastIndex === 0);
}

/**
 * Escapes regular expression characters in a given string
 */
export function escapeRegExpCharacters(value: string): string {
	return value.replace(/[\-\\\{\}\*\+\?\|\^\$\.\,\[\]\(\)\#\s]/g, '\\$&');
}
