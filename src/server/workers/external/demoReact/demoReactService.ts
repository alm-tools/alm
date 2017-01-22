import { TypedEvent } from '../../../../common/events';
import { kill } from '../../../utils/treeKill';
import { getPort } from '../../../utils/getPort';
import { appSettingsFolder } from '../../../disk/settings';
import * as mkdirp from 'mkdirp';

const workerPrefix = `[DEMO-REACT]`;

/**
 * This is where we write our index.html plus app.js
 */
const liveDemoFolder = appSettingsFolder + '/liveDemoReact';
mkdirp.sync(liveDemoFolder);

const appIndexTemplate = ({ jsFileName }: { jsFileName: string}) =>
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
  <script type="text/javascript" src="./${jsFileName}"></script>
</body>
</html>
`;

export namespace WorkerImplementation {
    export let currentFilePath = '';
    let demoPort: number = 4000;
    export const reloadReactDemo = new TypedEvent<{ port: number }>();

    export const enableLiveDemo = ({ filePath }: { filePath: string }) => {
        currentFilePath = filePath;
        return getPort(demoPort).then(port => {
            console.log(workerPrefix, `Started on filePath: ${filePath}, port: ${port}`);

            reloadReactDemo.emit({ port: port });

            return {};
        });
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
