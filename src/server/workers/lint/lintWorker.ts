/**
 * The heart of the linter
 */

/**
 * Load up TypeScript
 */
import * as byots from "byots";
const ensureImport = byots;

import * as sw from "../../utils/simpleWorker";
import * as contract from "./lintContract";

import { resolve, timer } from "../../../common/utils";
import * as utils from "../../../common/utils";
import * as types from "../../../common/types";
import { LanguageServiceHost } from "../../../languageServiceHost/languageServiceHostNode";
import { isFileInTypeScriptDir } from "../lang/core/typeScriptDir";
import { ErrorsCache } from "../../utils/errorsCache";

/** Bring in tslint */
import { Configuration, RuleFailure, Linter as LinterLocal } from "tslint";
/** The linter currently in use */
let Linter = LinterLocal;
/** TSLint types only used in options */
import { IConfigurationFile } from "../../../../node_modules/tslint/lib/configuration";

/**
 * Horrible file access :)
 */
import * as fsu from "../../utils/fsu";

const linterMessagePrefix = `[LINT]`

namespace Worker {
    export const setProjectData: typeof contract.worker.setProjectData = (data) => {
        /** Load a local linter if any */
        const basedir = utils.getDirectory(data.configFile.projectFilePath);
        return getLocalLinter(basedir).then((linter) => {
            Linter = linter;
            LinterImplementation.setProjectData(data);
            return {};
        })
    }
    export const fileSaved: typeof contract.worker.fileSaved = (data) => {
        LinterImplementation.fileSaved(data);
        return resolve({});
    }
}

// Ensure that the namespace follows the contract
const _checkTypes: typeof contract.worker = Worker;
// run worker
export const {master} = sw.runWorker({
    workerImplementation: Worker,
    masterContract: contract.master
});

/**
 * The actual linter stuff lives in this namespace
 */
namespace LinterImplementation {

    /** The tslint linter takes a few configuration options before it can lint a file */
    interface LinterConfig {
        projectData: types.ProjectDataLoaded;
        ls: ts.LanguageService;
        lsh: LanguageServiceHost;

        /** Only if there is a valid linter config found */
        linterConfig?: {
            configuration: IConfigurationFile,
            rulesDirectory: string | string[]
        }
    }
    let linterConfig: LinterConfig | null = null;

    /** We only do this once per project change */
    let informedUserAboutMissingConfig: boolean = false;

    /** Our error cache */
    const errorCache = new ErrorsCache();
    errorCache.errorsDelta.on(master.receiveErrorCacheDelta);

    /**
      * This is the entry point for the linter to start its work
      */
    export function setProjectData(projectData: types.ProjectDataLoaded) {
        /** Reinit */
        errorCache.clearErrors();
        informedUserAboutMissingConfig = false;
        linterConfig = null;

        /**
         * Create the program
         */
        const languageServiceHost = new LanguageServiceHost(undefined, projectData.configFile.project.compilerOptions);

        // Add all the files
        projectData.filePathWithContents.forEach(({filePath, contents}) => {
            languageServiceHost.addScript(filePath, contents);
        });
        // And for incremental ones lint again
        languageServiceHost.incrementallyAddedFile.on((data) => {
            //  console.log(data); // DEBUG
            loadLintConfigAndLint();
        });

        const languageService = ts.createLanguageService(languageServiceHost, ts.createDocumentRegistry());
        /**
         * We must call get program before making any changes to the files otherwise TypeScript throws up
         * we don't actually use the program just yet :)
         */
        const program = languageService.getProgram();

        /**
         * Now create the tslint config
         */
        linterConfig = {
            projectData,
            ls: languageService,
            lsh: languageServiceHost,
        };

        loadLintConfigAndLint();
    }

    /**
     * Called whenever
     *  - a file is edited
     *  - added to the compilation context
     */
    function loadLintConfigAndLint() {
        linterConfig.linterConfig = undefined;
        errorCache.clearErrors();
        /** Look for tslint.json by findup from the project dir */
        const projectDir = linterConfig.projectData.configFile.projectFileDirectory;
        const configurationPath = Linter.findConfigurationPath(null, projectDir);
        // console.log({configurationPath}); // DEBUG
        /** lint abort if the config is not ready present yet */
        if (!configurationPath) {
            if (!informedUserAboutMissingConfig) {
                informedUserAboutMissingConfig = true;
                console.log(linterMessagePrefix, 'No tslint configuration found.');
            }
            return;
        }

        /** We have our configuration file. Now lets convert it to configuration :) */
        let configuration: IConfigurationFile;
        try {
            configuration = Linter.loadConfigurationFromPath(configurationPath);
        }
        catch (err) {
            console.log(linterMessagePrefix, 'Invalid config:', configurationPath);
            errorCache.setErrorsByFilePaths([configurationPath], [types.makeBlandError(configurationPath, err.message, 'linter')]);
            return;
        }
        /** Also need to setup the rules directory */
        const possiblyRelativeRulesDirectory = configuration.rulesDirectory;
        const rulesDirectory = Linter.getRulesDirectories(possiblyRelativeRulesDirectory, configurationPath);

        /**
         * The linter config is now also good to go
         */
        linterConfig.linterConfig = {
            configuration, rulesDirectory
        }

        /** Now start the lazy lint */
        lintWithCancellationToken();
    }

    /** lint support cancellation token */
    let cancellationToken = utils.cancellationToken();
    function lintWithCancellationToken() {
        /** Cancel any previous */
        if (cancellationToken) {
            cancellationToken.cancel();
            cancellationToken = utils.cancellationToken();
        }

        const program = linterConfig.ls.getProgram();
        const sourceFiles =
            program.getSourceFiles()
                .filter(x => !x.isDeclarationFile);

        console.log(linterMessagePrefix, 'About to start linting files: ', sourceFiles.length); // DEBUG

        // Note: tslint is a big stingy with its definitions so we use `any` to make our ts def compat with its ts defs.
        const lintprogram = program as any;

        /** Used to push to the errorCache */
        const filePaths: string[] = [];
        let errors: types.CodeError[] = [];

        const time = timer();
        /** create the Linter for each file and get its output */
        utils
            .cancellableForEach({
                cancellationToken,
                items: sourceFiles,
                cb: (sf => {
                    const filePath = sf.fileName;
                    const contents = sf.getFullText();

                    const linter = new Linter({
                        rulesDirectory: linterConfig.linterConfig.rulesDirectory,
                        fix: false,
                    }, lintprogram);
                    linter.lint(filePath, contents, linterConfig.linterConfig.configuration);
                    const lintResult = linter.getResult();

                    filePaths.push(filePath);

                    if (lintResult.errorCount || lintResult.warningCount) {
                        // console.log(linterMessagePrefix, filePath, lintResult.failureCount); // DEBUG
                        errors = errors.concat(
                            lintResult.failures.map(
                                le => lintErrorToCodeError(le, contents)
                            )
                        );
                    }
                })
            })
            .then((res) => {
                /** Push to errorCache */
                errorCache.setErrorsByFilePaths(filePaths, errors);
                console.log(linterMessagePrefix, 'Lint complete', time.seconds);
            })
            .catch((e) => {
                if (e === utils.cancelled) {
                    console.log(linterMessagePrefix, 'Lint cancelled');
                }
                else {
                    console.log(linterMessagePrefix, 'Linter crashed', e);
                }
            });
    }

    export function fileSaved({filePath}: { filePath: string }) {
        if (!linterConfig) {
            return;
        }
        /** tslint : do the whole thing */
        if (filePath.endsWith('tslint.json')) {
            loadLintConfigAndLint();
            return;
        }
        /**
         * Now only proceed further if we have a linter config
         * and the file is a ts file
         * and in the current project
         */
        if (!linterConfig.linterConfig) {
            return;
        }
        if (!filePath.endsWith('.ts')) {
            return;
        }
        const sf = linterConfig.ls.getProgram().getSourceFiles().find(sf => sf.fileName === filePath);
        if (!sf) {
            return;
        }
        /** Update the file contents (so that when we get the program it just works) */
        linterConfig.lsh.setContents(filePath, fsu.readFile(sf.fileName));
        /**
         * Since we use program and types flow we would still need to lint the whole thing
         */
        lintWithCancellationToken();
    }

    /** Utility */
    function lintErrorToCodeError(lintError: RuleFailure, contents: string): types.CodeError {
        const start = lintError.getStartPosition().getLineAndCharacter();
        const end = lintError.getEndPosition().getLineAndCharacter();
        const preview = contents.substring(
            lintError.getStartPosition().getPosition(),
            lintError.getEndPosition().getPosition()
        );

        const result: types.CodeError = {
            source: 'linter',
            filePath: lintError.getFileName(),
            message: lintError.getFailure(),
            from: {
                line: start.line,
                ch: start.character
            },
            to: {
                line: end.line,
                ch: end.character
            },
            preview: preview,
            level: 'warning',
        }
        return result;
    }
}


/**
 * From
 * https://github.com/AtomLinter/linter-tslint/blob/2c8e99da92f9f2392adf26f5dd49d78a1a4ef753/lib/main.js
 */
const TSLINT_MODULE_NAME = 'tslint';
import * as requireResolve from 'resolve';
function getLocalLinter(basedir: string) {
    return new Promise<typeof LinterLocal>(resolve =>
        requireResolve(TSLINT_MODULE_NAME, { basedir },
            (err, linterPath, pkg) => {
                let linter;
                if (!err && pkg && /^4\./.test(pkg.version)) {
                    linter = (require(linterPath) as any).Linter;
                } else {
                    linter = LinterLocal;
                }
                return resolve(linter);
            },
        ),
    );
}
