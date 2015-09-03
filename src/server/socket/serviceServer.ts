import {contract} from "../../app/socket/serviceClientContract";
import * as fsu from "../utils/fsu";

export interface Echo {
    echo: any;
    num: number;
}
export function echo(data: Echo, client?: contract): Promise<Echo> {
    console.log('Echo request received:', data);
    return client.incrementNumber({ num: data.num }).then((res) => {
        return {
            echo: data.echo,
            num: res.num
        };
    });
}

export function getFileContents(data: { filePath: string }): Promise<{ contents: string }> {
    let contents = fsu.readFile(fsu.resolve(process.cwd(), data.filePath));
    return Promise.resolve({ contents });
}

import * as fslw from "../workers/fileListing/fileListingMaster";
export function getAllFiles(data: {}): Promise<{ fileList: string[] }> {
    return fslw.worker.getFileList({ directory: process.cwd() });
}
