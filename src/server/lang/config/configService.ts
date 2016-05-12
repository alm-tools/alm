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

type SupportedFileConfig = {
    // For `.json` files we add some *var* declaration as a prefix into the code we feed to the langauge service
    offset: string;
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
    isSupportedFile = (filePath: string): SupportedFileConfig | null => {
        const supportedFileNames: { [filename: string]: SupportedFileConfig } = {
            'tsconfig.json': { offset: 'export = ' }
        }
        const fileName = utils.getFileName(filePath);
        return supportedFileNames[fileName];
    }
}
const project = new Project();


import * as fmc from "../../disk/fileModelCache";
// On open add
// On edit edit
// On save reload
fmc.didOpenFile.on(e => {
    if (project.isSupportedFile(e.filePath)) {
        project.languageServiceHost.addScript(e.filePath, e.contents);
    }
});
fmc.didEdit.on(e => {
    if (project.isSupportedFile(e.filePath)) {
        const {filePath, edit: codeEdit} = e;
        project.languageServiceHost.applyCodeEdit(filePath, codeEdit.from, codeEdit.to, codeEdit.newText);
    }
});
fmc.savedFileChangedOnDisk.on(e => {
    if (project.isSupportedFile(e.filePath)) {
        project.languageServiceHost.setContents(e.filePath, e.contents);
    }
});

// TODO:
// On edit debounce error update
// Provide autocomplete
const debouncedErrorUpdate = (filePath: string) => {
    // Unlike the big brother Project this one only does live linting on the current file
}
