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
    prelude: string;
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
            'tsconfig.json': {
                prelude: 'export = ',
            }
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
    const config = project.isSupportedFile(e.filePath);
    if (config) {
        const prelude = config.prelude + '\n';
        project.languageServiceHost.addScript(e.filePath, prelude + e.contents);
    }
});
fmc.didEdit.on(e => {
    const config = project.isSupportedFile(e.filePath);
    if (config) {
        const prelude = config.prelude;
        const {filePath, edit: codeEdit} = e;
        const from = { line: codeEdit.from.line + 1, ch: codeEdit.from.ch };
        const to = { line: codeEdit.to.line + 1, ch: codeEdit.to.ch };
        project.languageServiceHost.applyCodeEdit(filePath, from, to, codeEdit.newText);
        debouncedErrorUpdate(filePath);
    }
});
fmc.savedFileChangedOnDisk.on(e => {
    const config = project.isSupportedFile(e.filePath);
    if (config) {
        const prelude = config.prelude + '\n';
        project.languageServiceHost.setContents(e.filePath, prelude + e.contents);
    }
});

// TODO:
// On edit debounce error update
// Provide autocomplete
const debouncedErrorUpdate = utils.debounce((filePath: string) => {
    // Unlike the big brother Project this one only does live linting on the current file
}, 500);
