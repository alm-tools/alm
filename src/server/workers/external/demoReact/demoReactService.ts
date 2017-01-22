import { TypedEvent } from '../../../../common/events';
import { kill } from '../../../utils/treeKill';
import { getPort } from '../../../utils/getPort';

const workerPrefix = `[DEMO-REACT]`;

export namespace WorkerImplementation {
    export let currentFilePath = '';
    export const clearLiveDemo = new TypedEvent<{}>();
    export const liveDemoData = new TypedEvent<{ data: string }>();

    export const enableLiveDemo = ({filePath}: { filePath: string }) => {
        console.log(workerPrefix, `Started on filePath: ${filePath}`);
        // if (executor) {
        //     executor.dispose();
        // }
        clearLiveDemo.emit({});
        // executor = new FileExecutor(filePath, (data) => {
        //     liveDemoData.emit({ data });
        // });
        currentFilePath = filePath;
        return Promise.resolve({})
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
