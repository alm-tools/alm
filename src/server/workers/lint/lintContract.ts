import * as sw from "../../utils/simpleWorker";
import * as types from "../../../common/types";

export const worker = {
    /** Linter takes in all the files in the project */
    setProjectData: {} as sw.QRFunction<types.ProjectDataLoaded, {}>,
    /** And then relints if a file changes on disk */
    fileSaved: {} as sw.QRFunction<{ filePath: string }, {}>,
}

export const master = {
    /** Linter sends out errors */
    receiveErrorCacheDelta: {} as sw.QRFunction<types.ErrorCacheDelta, {}>,
}
