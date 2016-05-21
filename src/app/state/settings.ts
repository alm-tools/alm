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

function createSimpleSetting<T>(key: string) {
    return {
        set: (value: T): void => {
            setSetting(key, value);
        },
        get: (): Promise<T | undefined> => {
            return getSetting(key)
        }
    }
}

/**
 * DOCTOR
 */
export const showDoctor = createSimpleSetting<boolean>('showDoctor');

/**
 * Errors expanded
 */
export const errorsExpanded = createSimpleSetting<boolean>('errorsExpanded');

/**
 * File Tree expanded
 */
export const fileTreeExpanded = createSimpleSetting<boolean>('fileTreeExpanded');

/**
 * File Tree width
 */
export const fileTreeWidth = createSimpleSetting<number>('fileTreeWidth');


/**
 * Main panel height
 */
export const mainPanelHeight = createSimpleSetting<number>('mainPanelHeight');

/**
 * Debugging tabs
 */
export const tabs = createSimpleSetting<any>('weeeUITabs');
