/**
 * All our interaction with the file system generally goes through here
 */
import {FileModel} from "./fileModel";
import {TypedEvent} from "../../common/events";
import * as fsu from "../utils/fsu";

export var savedFileChangedOnDisk = new TypedEvent<{ filePath: string; contents: string }>();
export var didEdit = new TypedEvent<{ filePath: string; edit: CodeEdit }>();
export var didStatusChange = new TypedEvent<{ filePath: string; saved: boolean }>();

let openFiles: FileModel[] = [];
export function getOpenFile(filePath: string) {
    if (openFiles.some(f => f.config.filePath == filePath)) {
        return openFiles.filter(f => f.config.filePath == filePath)[0];
    }
}
export function getOrCreateOpenFile(filePath: string, autoCreate = false) {
    var file = getOpenFile(filePath);
    if (!file) {
        /** If you request a file that isn't there ... we are going to create it */
        if (!fsu.existsSync(filePath) && autoCreate) {
            fsu.writeFile(filePath, '');
        }

        file = new FileModel({
            filePath: filePath
        });
        file.onSavedFileChangedOnDisk.on((evt) => {
            savedFileChangedOnDisk.emit({ filePath, contents: evt.contents });
        });
        file.didEdit.on((evt) => {
            didEdit.emit({ filePath, edit: evt.codeEdit });
        });
        file.didStatusChange.on((evt) => {
            didStatusChange.emit({ filePath, saved: evt.saved });
        });
        openFiles.push(file);
    }
    return file;
}
export function closeOpenFile(filePath: string) {
    var file = getOpenFile(filePath);
    if (file) {
        file.save();
        // Right now we still keep the file open indefinitely
        // openFiles = openFiles.filter(f=> f.config.filePath !== filePath);
    }
}

export function getOpenFiles(): FileModel[] {
    return openFiles;
}

export function isFileOpen(filePath: string) {
    return !!getOpenFile(filePath);
}

export function saveOpenFile(filePath: string) {
    let file = getOpenFile(filePath);
    file.save();
}

export function deleteFromDisk(data:{files: string[], dirs: string[]}) {
    data.files.forEach(filePath => {
        var file = getOpenFile(filePath);
        if (file) {
            file.delete();
            openFiles = openFiles.filter(f=> f.config.filePath !== filePath);
        }
        else {
            fsu.deleteFile(filePath);
        }
    });
    data.dirs.forEach(dirPath => {
        // delete any open files
        let toClose = (filePath: string) => {
            return filePath.startsWith(dirPath);
        }
        openFiles.filter(f => toClose(f.config.filePath)).forEach(f => f.delete());
        openFiles = openFiles.filter(f => !toClose(f.config.filePath));

        // delete the dir
        fsu.deleteDir(dirPath);
    });
}

export function duplicateFile(data: { src: string, dest: string }) {
    let contents = fsu.readFile(data.src);
    fsu.writeFile(data.dest, contents);
}

import {ncp} from "ncp";
export function duplicateDir(data:{ src: string, dest: string }) {
    ncp(data.src,data.dest,(err)=>{
    });
}
