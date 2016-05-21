/**
 * Just provides a nice *type* over the simple transient settings
 */
import {server} from "../../socket/socketClient";
import {getSessionId} from "./clientSession";

function setSetting(key: string, value: any) {
    server.setSetting({
        sessionId: getSessionId(),
        settingId: key,
        value
    });
}
function getSetting(key: string): Promise<any> {
    return server.getSetting({
        sessionId: getSessionId(),
        settingId: key
    });
}

export function setShowDoctor(value: boolean) {
    setSetting('doctor', value);
}

export function getShowDoctor(): Promise<boolean> {
    return getSetting('doctor');
}
