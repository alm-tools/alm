import { TypedEvent } from '../../../../common/events';
import { kill } from '../../../utils/treeKill';
import { appSettingsFolder } from '../../../disk/settings';
import * as mkdirp from 'mkdirp';
import * as fsu from '../../../utils/fsu';
import { bundle } from './bundler/master';

const workerPrefix = `[DEMO-REACT]`;

/**
 * This is where we write our index.html plus app.js
 */
export const liveDemoFolder = appSettingsFolder + '/liveDemoReact';
mkdirp.sync(liveDemoFolder);

/** Our index file name */
const outputFileName = liveDemoFolder + '/index.js';

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
  <div id="root"></div>
  <script type="text/javascript" src="./index.js"></script>
</body>
</html>
`
);

export namespace WorkerImplementation {
    export let currentFilePath = '';
    export const reloadReactDemo = new TypedEvent<{}>();

    export const enableLiveDemo = async ({ filePath }: { filePath: string }) => {
        currentFilePath = filePath;

        await bundle({
            entryPointName: filePath,
            outputFileName: outputFileName,
            prod: false,
        });

        console.log(workerPrefix, `Input: ${filePath}`);
        console.log(workerPrefix, `Output: ${outputFileName}`);

        reloadReactDemo.emit({});
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
