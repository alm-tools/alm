import * as sw from "../../../../utils/simpleWorker";
import * as contract from "./bundlerContract";
import { TypedEvent } from '../../../../../common/events';
import { LiveDemoBundleResult } from '../../../../../common/types';
import { appSettingsFolder } from "../../../../disk/settings";
import * as mkdirp from 'mkdirp';
import * as fsu from '../../../../utils/fsu';

/** Emitted everytime a build completes */
export const liveDemoBuildComplete = new TypedEvent<LiveDemoBundleResult>();

namespace Master {
    export const bundleStatus: typeof contract.master.bundleStatus = async (q) => {
        liveDemoBuildComplete.emit(q);
        console.log(workerPrefix, `Update: ${q.type}`);
        return {};
    }
}
// Ensure that the namespace follows the contract
const _checkTypes: typeof contract.master = Master;

// launch worker
const { worker, parent } = sw.startWorker({
    workerPath: __dirname + '/bundlerWorker',
    workerContract: contract.worker,
    masterImplementation: Master
});

export function start(config: {
    entryFilePath: string,
    outputDirPath: string,
}) {
    worker.start(config);
}


const workerPrefix = `[DEMO-REACT]`;

/**
 * This is where we write our index.html plus app.js
 */
export const liveDemoFolder = appSettingsFolder + '/liveDemoReact';
mkdirp.sync(liveDemoFolder);

/** Our index file name */
const outputFileName = liveDemoFolder + '/index.js';
/** The alm file name */
const outputAlmName = liveDemoFolder + '/alm.js';

/** Our html template file */
fsu.writeFile(liveDemoFolder + '/index.html',
    `
<!DOCTYPE html>
<html>
<head>
    <!-- Standard Meta -->
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <meta name="viewport" content="width=device-width">
    <title>ALM Live React Demo</title>
</head>
<body>
  <div id="root">
      <div id="waiting-for-render" style="font-family: arial; opacity: 0; transition: opacity 1s;">
      ...make sure you call render in your demo file...
      </div>
  </div>
  <script>
    setTimeout(function(){
        var waitingForRender = document.getElementById('waiting-for-render');
        if (waitingForRender){ waitingForRender.style.opacity = "1"; }
    }, 2000);
  </script>
  <script type="text/javascript" src="./alm.js"></script>
  <script type="text/javascript" src="./index.js"></script>
</body>
</html>
`
);

export namespace ExternalAPI {
    export let currentFilePath = '';

    export const enableLiveDemo = async ({ filePath }: { filePath: string }) => {
        currentFilePath = filePath;

        fsu.writeFile(outputAlmName, `
        console.log("Placeholder alm file while build is in progress");
        `);
        fsu.writeFile(outputFileName, `
        document.getElementById('root').innerHTML = '';
        console.log("Placeholder index file while build is in progress");
        `);

        start({
            entryFilePath: filePath,
            outputDirPath: liveDemoFolder,
        });

        console.log(workerPrefix, `Input: ${filePath}`);
        return {};
    };
    export const disableLiveDemo = () => {
        // if (executor) {
        //     clearLiveDemo.emit({});
        //     executor.dispose();
        //     executor = undefined;
        //     currentFilePath = '';
        // }
        return Promise.resolve({})
    }
}
