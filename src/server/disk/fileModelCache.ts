import {FileModel} from "./fileModel";
import {TypedEvent} from "../../common/events";

export var savedFileChangedOnDisk = new TypedEvent<{ filePath: string; contents: string }>();

let openFiles: FileModel[] = [];
export function getOpenFile(filePath: string) {
    if (openFiles.some(f=> f.config.filePath == filePath)) {
        return openFiles.filter(f=> f.config.filePath == filePath)[0];
    }
}
export function getOrCreateOpenFile(filePath: string) {
    var file = getOpenFile(filePath);
    if (!file) {
        file = new FileModel({
            filePath: filePath
        });
        file.onSavedFileChangedOnDisk.on((evt)=>{
            savedFileChangedOnDisk.emit({ filePath, contents: evt.contents });
        });
        openFiles.push(file);
    }
    return file;
}
export function closeOpenFile(filePath: string) {
    var file = getOpenFile(filePath);
    if (file) {
        file.close();
        // Right now we still keep the file open indefinitely
        // openFiles = openFiles.filter(f=> f.config.filePath !== filePath);
    }
}

export function getOpenFiles(): FileModel[] {
    return openFiles;
}
