import * as sw from "../../../../utils/simpleWorker";
import * as types from '../../../../../common/types';

export const worker = {
    start: {} as sw.QRFunction<{ entryFilePath: string, outputFilePath: string }, {}>,
}

export const master = {
    bundleStatus: {} as sw.QRFunction<types.LiveDemoBundleResult, {  }>,
}
