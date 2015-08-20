export var errorCodes = {
    success: 0,
    unknownError: 1,
    couldNotListen: 2,
}

export function exit(code = errorCodes.success) {
    if (code == errorCodes.couldNotListen) {
        console.log('here')
        console.error("Could not listen on specified port");
    }
    process.exit(code);
}