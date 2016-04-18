import * as chalk from "chalk";

/**
 * Warning: This function is used without type checking from `server.ts`
 * Reason: Don't want the complexity of cyclic dependencies.
 * This file is only loaded lazily so its okay.
 * This file will load the `projectServiceWorker` into main server memory
 * But its okay cause its only for building after which we exit
 */
export function doBuild(tsconfigFilePath: string) {
    let noErrors = true;

    // TODO: build
    // NOTE: before we can do build server stuff
    // we need to upgrade setActiveProjectConfigDetails to accept file contents upfront instead of asking the master for it.

    if (noErrors){
        console.log(chalk.green('Build Succeeded'));
        process.exit(0);
    }
    else {
        console.log(chalk.red('Build Failed'));
        process.exit(1);
    }
}
