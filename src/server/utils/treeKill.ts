/**
 * @module
 * TypeScript version of https://github.com/pkrumins/node-tree-kill/blob/master/index.js
 */
import childProcess = require('child_process');
const spawn = childProcess.spawn;
const exec = childProcess.exec;

export function kill(pid: number, signal: 'SIGTERM' | 'SIGINT' = 'SIGTERM'): Promise<void> {
    let resolve: () => void;
    const res = new Promise<void>((res) => resolve = res);

    var tree = {};
    var pidsToProcess = {};
    tree[pid] = [];
    pidsToProcess[pid] = 1;

    switch (process.platform) {
        case 'win32':
            exec('taskkill /pid ' + pid + ' /T /F', resolve);
            break;
        case 'darwin':
            buildProcessTree(pid, tree, pidsToProcess, function(parentPid) {
                return spawn('pgrep', ['-P', parentPid]);
            }, function() {
                killAll(tree, signal, resolve);
            });
            break;
        default: // Linux
            buildProcessTree(pid, tree, pidsToProcess, function(parentPid) {
                return spawn('ps', ['-o', 'pid', '--no-headers', '--ppid', parentPid]);
            }, function() {
                killAll(tree, signal, resolve);
            });
            break;
    }

    return res;
};

function killAll(tree, signal, callback) {
    var killed = {};
    try {
        Object.keys(tree).forEach(function(pid) {
            tree[pid].forEach(function(pidpid) {
                if (!killed[pidpid]) {
                    killPid(pidpid, signal);
                    killed[pidpid] = 1;
                }
            });
            if (!killed[pid]) {
                killPid(pid, signal);
                killed[pid] = 1;
            }
        });
    } catch (err) {
        if (callback) {
            return callback(err);
        } else {
            throw err;
        }
    }
    if (callback) {
        return callback();
    }
}

function killPid(pid, signal) {
    try {
        process.kill(parseInt(pid, 10), signal);
    }
    catch (err) {
        if (err.code !== 'ESRCH') throw err;
    }
}

function buildProcessTree(parentPid, tree, pidsToProcess, spawnChildProcessesList, cb) {
    var ps = spawnChildProcessesList(parentPid);
    var allData = '';
    ps.stdout.on('data', function(data) {
        var data = data.toString('ascii');
        allData += data;
    });

    var onClose = function(code) {
        delete pidsToProcess[parentPid];

        if (code != 0) {
            // no more parent processes
            if (Object.keys(pidsToProcess).length == 0) {
                cb();
            }
            return;
        }

        allData.match(/\d+/g).forEach(function(_pid) {
            let pid = parseInt(_pid, 10);
            tree[parentPid].push(pid);
            tree[pid] = [];
            pidsToProcess[pid] = 1;
            buildProcessTree(pid, tree, pidsToProcess, spawnChildProcessesList, cb);
        });
    };

    ps.on('close', onClose);
}
