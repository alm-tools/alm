/**
 * Gets / sets the client session id using the url
 */

export const getSessionId = () => window.location.hash.substr(1);
export const setSessionId = (sessionId: string) => {
    // http://stackoverflow.com/questions/12381563/how-to-stop-browser-back-button-using-javascript
    const hash = '#' + sessionId;
    window.location.hash = hash;
    window.location.hash = "Again-No-back-button"; // again because google chrome don't insert first hash into history
    window.location.hash = hash;
    window.onhashchange = function() { window.location.hash = hash }
}
