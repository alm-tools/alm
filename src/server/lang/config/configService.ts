/**
 * TODO: THIS ISNT USED YET.
 * This is used to provide autocomplete / error handling for config files like
 * alm.ts // Planned
 * gruntfile.ts // Planned
 * gulpfile.js // Planned
 * webpack.config.js // Planned
 */
import * as utils from "../../../common/utils";
import {Types} from "../../../socket/socketContract";
import * as lsh from "../../../languageServiceHost/languageServiceHost";
import fuzzaldrin = require('fuzzaldrin');

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
        this.languageServiceHost = new lsh.LanguageServiceHost(undefined, {
            allowNonTsExtensions: true,
            allowJs: true,
            noLib: true, // Will result in lots of errors but we don't want lib.d.ts completions
        });
        this.languageService = ts.createLanguageService(this.languageServiceHost, ts.createDocumentRegistry());
    }
    isSupportedFile = (filePath: string): SupportedFileConfig | null => {
        const supportedFileNames: { [filename: string]: SupportedFileConfig } = {
            'tsconfig.json': {
                prelude: 'var prelude: {bar: string, bas: "a" | "b"} = ',
            }
        }
        const fileName = utils.getFileName(filePath);
        return supportedFileNames[fileName];
    }
}
export const project = new Project();


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
fmc.didEdits.on(e => {
    const config = project.isSupportedFile(e.filePath);
    if (config) {
        const prelude = config.prelude;
        const {filePath, edits: codeEdits} = e;
        codeEdits.forEach(codeEdit => {
            const from = { line: codeEdit.from.line + 1, ch: codeEdit.from.ch };
            const to = { line: codeEdit.to.line + 1, ch: codeEdit.to.ch };
            project.languageServiceHost.applyCodeEdit(filePath, from, to, codeEdit.newText);
            debouncedErrorUpdate(filePath);
        });
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

/**
 * Provide autocomplete
 */
export function getCompletionsAtPosition(query: Types.GetCompletionsAtPositionQuery): Promise<Types.GetCompletionsAtPositionResponse> {
    /**
     * Customizations for json lookup
     */
    const config = project.isSupportedFile(query.filePath);
    const position = query.position + config.prelude.length;

    /** The rest is conventional get completions logic: */

    const {filePath, prefix} = query;
    const service = project.languageService;

    const completions: ts.CompletionInfo = service.getCompletionsAtPosition(filePath, position);
    let completionList = completions ? completions.entries.filter(x => !!x) : [];
    const endsInPunctuation = utils.prefixEndsInPunctuation(prefix);

    if (prefix.length && prefix.trim().length && !endsInPunctuation) {
        // Didn't work good for punctuation
        completionList = fuzzaldrin.filter(completionList, prefix.trim(), { key: 'name' });
    }

    /** Doing too many suggestions is slowing us down in some cases */
    let maxSuggestions = 50;
    /** Doc comments slow us down tremendously */
    let maxDocComments = 10;

    // limit to maxSuggestions
    if (completionList.length > maxSuggestions) completionList = completionList.slice(0, maxSuggestions);

    // Potentially use it more aggresively at some point
    // This queries the langauge service so its a bit slow
    function docComment(c: ts.CompletionEntry): {
        /** The display parts e.g. (a:number)=>string */
        display: string;
        /** The doc comment */
        comment: string;
    } {
        const completionDetails = project.languageService.getCompletionEntryDetails(filePath, position, c.name);
        const comment = ts.displayPartsToString(completionDetails.documentation || []);

        // Show the signatures for methods / functions
        var display: string;
        if (c.kind == "method" || c.kind == "function" || c.kind == "property") {
            let parts = completionDetails.displayParts || [];
            // don't show `(method)` or `(function)` as that is taken care of by `kind`
            if (parts.length > 3) {
                parts = parts.splice(3);
            }
            display = ts.displayPartsToString(parts);
        }
        else {
            display = '';
        }
        display = display.trim();

        return { display: display, comment: comment };
    }

    let completionsToReturn: Types.Completion[] = completionList.map((c, index) => {
        if (index < maxDocComments) {
            var details = docComment(c);
        }
        else {
            details = {
                display: '',
                comment: ''
            }
        }
        return {
            name: c.name,
            kind: c.kind,
            comment: details.comment,
            display: details.display
        };
    });



    //  console.log('here2', completionsToReturn);
    /**
     * More json customizations
     */
    completionsToReturn = completionsToReturn
        /** remove keywords */
        .filter(c => c.kind != "keyword")
        /** Remove any types introduced by the prelude */
        .filter(c => c.kind != "var");

    /**
     * Make completions json friendly
     */
    completionsToReturn.forEach(c => {
        if (c.name !== "false" && c.name !== "true") {
            c.name = `"${c.name}"`
        }
    });

    return utils.resolve({
        completions: completionsToReturn,
        endsInPunctuation: endsInPunctuation
    });
}
