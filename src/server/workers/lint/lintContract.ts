import * as sw from "../../utils/simpleWorker";
import * as types from "../../../common/types";

export const worker = {
    /** Linter takes in all the files in the project */
    setProjectData: {} as sw.QRFunction<types.ProjectDataLoaded, {}>,
}

export const master = {
    /** Linter sends out errors */
    receiveErrorCacheDelta: {} as sw.QRFunction<ErrorCacheDelta, {}>,
}
