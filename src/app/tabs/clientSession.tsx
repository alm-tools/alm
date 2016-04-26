/**
 * Gets / sets the client session id using the url
 */

export const getSessionId = () => window.location.hash.substr(1);
export const setSessionId = (sessionId: string) => {
     const hash = '#' + sessionId;
     window.location.hash = hash;
     window.onhashchange = function() { window.location.hash = hash }
 }
