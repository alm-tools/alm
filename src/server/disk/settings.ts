/**
 * The settings are more global than `session`.
 * A good use case for `setting` is the projects the user opens
 */
/** Imports */
import * as utils from "../../common/utils";
import * as mkdirp from "mkdirp";
import * as fsu from "../utils/fsu";
import * as json from "../../common/json";

/**
 * All our settings
 */
export interface Settings {
    workingDirs: string[];
}

/**
 * From http://stackoverflow.com/questions/19275776/node-js-how-to-get-the-os-platforms-user-data-folder/26227660#26227660

OS X - '/Users/user/Library/Preferences'
Windows 8 - 'C:\Users\User\AppData\Roaming'
Windows XP - 'C:\Documents and Settings\User\Application Data'
Linux - '/var/local'
 */
const userDataDir = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + 'Library/Preferences' : '/var/local');
const appSettingsFolder = userDataDir + '/alm';
mkdirp.sync(appSettingsFolder);
const appSettingsFile = appSettingsFolder + '/settingsV1.json';

/**
 * Get / Set Settings
 */
function getSettings(): Settings {
    let settings: Settings =
        {
            workingDirs: []
        };

    if (fsu.existsSync(appSettingsFile)) {
        const parsed = json.parse<Settings>(fsu.readFile(appSettingsFile));
        if (parsed.error) {
            console.error('Could not parse the settings file:', parsed.error);
            return settings;
        }

        /** Other validations */
        if (!Array.isArray(parsed.data.workingDirs)) {
            console.error('settings.workingDirs should be an array');
            return settings;
        }

        /** All good! */
        settings = parsed.data;
    }

    return settings;
}

function setSettings(settings: Settings) {
    const str = json.stringify(settings);
    fsu.writeFile(appSettingsFile, str);
}

/**
 * Various setting functions
 */
function addWorkingDir(workingDir: string) {
    const settings = getSettings();
    if (settings.workingDirs.find((x) => x === workingDir)) return;
    settings.workingDirs.push(workingDir);
    setSettings(settings);
}
