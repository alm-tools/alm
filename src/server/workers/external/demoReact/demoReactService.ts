import { TypedEvent } from '../../../../common/events';
import { kill } from '../../../utils/treeKill';
import { getPort } from '../../../utils/getPort';

const workerPrefix = `[DEMO-REACT]`;

export namespace WorkerImplementation {
    export let currentFilePath = '';
    let demoPort: number = 4000;
    export const reloadReactDemo = new TypedEvent<{port: number}>();

    export const enableLiveDemo = ({filePath}: { filePath: string }) => {
        console.log(workerPrefix, `Started on filePath: ${filePath}`);
        currentFilePath = filePath;
        return getPort(demoPort).then(res => {
            reloadReactDemo.emit({ port: res });
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
