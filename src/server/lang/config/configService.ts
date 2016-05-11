/**
 * This is used to provide autocomplete / error handling for config files like
 * alm.ts // Planned
 * gruntfile.ts // Planned
 * gulpfile.js // Planned
 * webpack.config.js // Planned
 * tsconfig.json
 */
import * as utils from "../../../common/utils";
import * as lsh from "../../../languageServiceHost/languageServiceHost";

const isSupportedFile = (filePath:string) => {
    const supportedFileNames = {
        'tsconfig.json': true
    }
    const fileName = utils.getFileName(filePath);
    return !!supportedFileNames[fileName];
}
/**
 * A simpler project, wraps LanguageServiceHost and LanguageService
 * with default options we need for config purposes
 */
class Project {
    languageService: ts.LanguageService;
    languageServiceHost: lsh.LanguageServiceHost;
    constructor() {
        this.languageServiceHost = new lsh.LanguageServiceHost({
            allowNonTsExtensions: true,
            allowJs: true,
        });
        this.languageService = ts.createLanguageService(this.languageServiceHost, ts.createDocumentRegistry());
    }
}
const project = new Project();


import * as fmc from "../../disk/fileModelCache";
// TODO:
// On open add
// On edit edit
// On save reload
// On edit debounce error update
// Provide autocomplete
