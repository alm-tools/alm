import * as sw from "../../utils/simpleWorker";
import * as types from "../../../common/types";

export const worker = {
    /** Relints if a file changes on disk */
    fileSaved: {} as sw.QRFunction<{ filePath: string }, {}>,
}

export const master = {
    /** Sends out test resuts */
    receiveErrorCacheDelta: {} as sw.QRFunction<types.TestSuiteResult, {}>,
}
