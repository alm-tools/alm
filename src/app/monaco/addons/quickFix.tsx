import {CompositeDisposible} from "../../../common/events";
import {cast, server} from "../../../socket/socketClient";
import * as utils from "../../../common/utils";
import * as state from "../../state/state";
import {LiveAnalysisResponse} from "../../../common/types";
import * as commands from "../../commands/commands";

require('./quickFix.css');
type Editor = monaco.editor.ICodeEditor;

const quickFixClassName = 'monaco-quickfix';
const quickFixDecorationOptions: monaco.editor.IModelDecorationOptions = {
    glyphMarginClassName: quickFixClassName,
    isWholeLine: true,
    hoverMessage: 'QuickFixes available. Click to select.'
};
