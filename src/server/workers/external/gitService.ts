/**
 * The stuff that interacts with system git
 */
import * as cp from "child_process";
import * as wd from "../../disk/workingDir";
import * as fmc from "../../disk/fileModelCache";
import * as types from "../../../common/types";

/** Main utility function to execute a command */
let gitCmd = (...args: string[]): Promise<string> => {
    return new Promise((resolve, reject) => {
        cp.exec(`git ${args.join(' ')}`, { cwd: wd.getProjectRoot() }, (err, stdout, stderr) => {
            if (stderr.toString().trim().length) {
                return resolve(stderr.toString());
            }
            return resolve(stdout);
        });
    });
}

export function gitStatus(args: {}): Promise<string> {
    return gitCmd('status');
}

/** This is a soft reset. i.e. it keeps your staged changes */
export function gitReset(args: { filePath: string }): Promise<string> {
    fmc.saveOpenFile(args.filePath);
    // Delay because if we reset the file immediately the ^ save
    // makes the *change* detection in file model view to ignore what happened.
    return new Promise((resolve, reject) =>
        setTimeout(() => {
            gitCmd('checkout --', args.filePath).then(resolve, reject);
        }, 500)
    );
}

/**
 * Docs :
 * - http://stackoverflow.com/q/37097761/390330
 * - https://git-scm.com/docs/git-diff
 * Some inspiration : https://github.com/jisaacks/GitGutter/blob/1f673cbe009e2e0f4393c25e83be895871b4923f/git_gutter_handler.py#L149-L177
 */
const gitDiffRegex = /@@[^@@]*@@/g;
export function gitDiff(args: { filePath: string }): Promise<types.GitDiff> {
    // Save the file if not saved
    const file = fmc.getOrCreateOpenFile(args.filePath);
    if (!file.saved()) {
        fmc.saveOpenFile(args.filePath);
    }

    /**
     * We diff with `HEAD` to still show staged changes (as there are still in your headspace as *area you are working on*)
     */
    return gitCmd('diff', '-U0', '--no-color', '--no-ext-diff', 'HEAD', args.filePath).then(res => {
        const added: types.GitDiffSpan[] = [];
        const removed: number[] = [];
        const modified: types.GitDiffSpan[] = [];

        const matches = res.match(gitDiffRegex);
        if (matches) {
            matches.forEach(m => {
                // m is something like one of:
                // @@ -n1[,n2] +n3[,n4] @@
                // console.log(m); // DEBUG

                // Remove @@:
                m = m.replace(/@@/g, '');
                m = m.trim();

                // m is now like:
                // -n1[,n2] +n3[,n4]
                const [n1n2, n3n4] = m.split(' ');
                const [n1, n2] = n1n2.split(',');
                const [n3, n4] = n3n4.split(',');

                // n2 === 0 means all addition
                if (n2 != null && +n2 === 0) {
                    added.push({
                        from: +n3 - 1,
                        to: +n3 + (n4 == null ? 1 : +n4) - 1
                    });
                }
                // n4 === 0 means all deletion
                else if (n4 != null && +n4 === 0) {
                    removed.push(+n3 - 1);
                }
                // modified
                else {
                    modified.push({
                        from: +n3 - 1,
                        to: +n3 + (n4 == null ? 1 : +n4) - 1
                    });
                }
            });
        }

        return {
            added, removed, modified
        }
    });
}
