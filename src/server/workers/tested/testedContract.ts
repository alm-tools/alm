import * as sw from "../../utils/simpleWorker";
import * as types from "../../../common/types";

export const worker = {
    /** Start or restart */
    init: {} as sw.QRFunction<{workingDir: string} , {}>,
    /** Relints if a file changes on disk */
    fileSaved: {} as sw.QRFunction<{ filePath: string }, {}>,
}

export const master = {
    /** Sends out test resuts */
    receiveTestResultDelta: {} as sw.QRFunction<types.TestDelta, {}>,
    /** Sends out errors for config / file exceptions */
    receiveErrorCacheDelta: {} as sw.QRFunction<ErrorCacheDelta, {}>,
}
