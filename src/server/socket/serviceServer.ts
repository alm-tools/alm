import {contract} from "../../app/socket/serviceClientContract";

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

import * as fslw from "../workers/fileListing/fileListingMaster";
export function getAllFiles(data: {}): Promise<{ fileList: string[] }> {
    return fslw.worker.getFileList({ directory: process.cwd() });
}
