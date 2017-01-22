import * as sw from "../../../../utils/simpleWorker";
import * as types from '../../../../../common/types';

export const worker = {
    start: {} as sw.QRFunction<{ entryFileName: string, outputFileName: string }, {}>,
}

export const master = {
    buildComplete: {} as sw.QRFunction<types.LiveDemoBuildResult, {  }>,
}
