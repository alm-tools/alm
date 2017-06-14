import * as ui from "../../ui";
import * as csx from '../../base/csx';
import * as React from "react";
import { cast, server } from "../../../socket/socketClient";
import * as docCache from "../model/docCache";
import * as types from "../../../common/types";
import * as cursorHistory from "../../cursorHistory";
import * as search from "../search/monacoSearch";
import * as semanticView from "../addons/semanticView";
import * as monacoUtils from "../monacoUtils";
import * as gitStatus from "../addons/gitStatus";
import * as liveAnalysis from "../addons/liveAnalysis";
import * as quickFix from "../addons/quickFix";
import * as linter from "../addons/linter";
import * as docblockr from "../addons/dockblockr";
import * as doctor from "../addons/doctor";
import * as testedMonaco from "../addons/testedMonaco";
import * as utils from '../../../common/utils';
import * as autoCloseTag from '../addons/autoCloseTag';

// Any other style modifications
require('./codeEditor.css');

/**
 * The monokai theme
 * Reference : https://github.com/Microsoft/vscode/blob/d296b8e5b28925ea2df109baa2487c1d26f6ff3c/src/vs/editor/common/standalone/themes.ts
 */
import IThemeRule = monaco.editor.IThemeRule;
export const monokai: IThemeRule[] = [
    { token: '', foreground: 'f8f8f2' },

    { token: 'comment', foreground: '75715e' },

    { token: 'string', foreground: 'e6db74' },
    { token: 'support.property-value.string.value.json', foreground: 'e6db74' },

    { token: 'constant.numeric', foreground: 'ae81ff' },
    { token: 'constant.language', foreground: 'ae81ff' },
    { token: 'constant.character', foreground: 'ae81ff' },
    { token: 'constant.other', foreground: 'ae81ff' },

    { token: 'keyword', foreground: 'f92672' },
    { token: 'support.property-value.keyword.json', foreground: 'f92672' },

    { token: 'storage', foreground: 'aae354' },
    { token: 'storage.type', foreground: '66d9ef', fontStyle: 'italic' },

    { token: 'entity.name.class', foreground: 'a6e22e' },
    { token: 'entity.other', foreground: 'a6e22e' },
    { token: 'entity.name.function', foreground: 'a6e22e' },
    { token: 'entity.name.tag', foreground: 'f92672' },
    { token: 'entity.other.attribute-name', foreground: 'a6e22e' },

    { token: 'variable', foreground: 'f8f8f2' },
    { token: 'variable.parameter', foreground: 'fd971f', fontStyle: 'italic' },

    { token: 'support.function', foreground: '66d9ef' },
    { token: 'support.constant', foreground: '66d9ef' },
    { token: 'support.type', foreground: '66d9ef' },
    { token: 'support.class', foreground: '66d9ef', fontStyle: 'italic' },

    /** We use qualifier for `const`, `var`, `private` etc. */
    { token: 'qualifier', foreground: '00d0ff' },
    /* `def` does not exist. We like to use it for variable definitions */
    { token: 'def', foreground: 'fd971f' },
    /** variable-2 doesn't exist. We use it for identifiers in type positions */
    { token: 'variable-2', foreground: '9effff' },
];
monaco.editor.defineTheme('monokai', {
    base: 'vs-dark',
    inherit: true,
    rules: monokai
});

/**
 * We extend the monaco editor
 */
declare global {
    module monaco {
        module editor {
            interface ICommonCodeEditor {
                /** keep `filePath` */
                filePath?: string;
            }
        }
    }
}

interface Props {
    onFocusChange?: (focused: boolean) => any;
    readOnly?: boolean;
    filePath: string;

    /** This is the only property we allow changing dynamically. Helps with rendering the same file path for different previews */
    preview?: ts.TextSpan;
}

export class CodeEditor extends ui.BaseComponent<Props, { isFocused?: boolean, loading?: boolean }>{
    constructor(props) {
        super(props);

        this.state = {
            isFocused: false,
            loading: true,
        };
    }

    editor: monaco.editor.ICodeEditor;
    refs: {
        [string: string]: any;
        codeEditor: HTMLDivElement;
    }

    /** Ready after the doc is loaded */
    ready = false;
    afterReadyQueue: { (): void }[] = [];
    /** If already ready it execs ... otherwise waits */
    afterReady = (cb: () => void) => {
        if (this.ready) cb();
        else {
            this.afterReadyQueue.push(cb);
        }
    }

    componentDidMount() {
        var mountNode = this.refs.codeEditor;
        const { filePath } = this.props;

        this.editor = monaco.editor.create(mountNode, {
            value: '...',
            theme: 'monokai',
            folding: true,
            autoClosingBrackets: true,
            wrappingColumn: 0,
            readOnly: false, // Never readonly ... even for readonly editors. Otherwise monaco doesn't highlight active line :)
            scrollBeyondLastLine: false, // Don't scroll by mouse where you can't scroll by keyboard :)
            formatOnType: true,
            contextmenu: false, // Disable context menu till we have it actually useful
            /** Move snippet suggestions to the bottom */
            snippetSuggestions: 'bottom',
            /** Since everything else in our UI is Square */
            roundedSelection: false,
            /** For git status, find results, errors */
            overviewRulerLanes: 3,
            /** Don't reserve too much space for line numbers */
            lineNumbersMinChars: 4,
            /** We need the glyph margin to show live analysis stuff */
            glyphMargin: true,
            /**
             * Change the default font.
             * The default is `consolas` , `courier new`.
             * This means that if user does not have consolas they get *aweful* courier new.
             * Don't want that.
             * Also the default change by OS.
             * I prefer consistency so going with custom font everywhere
             */
            fontFamily: 'consolas, menlo, monospace',
            /** Also make the font a bit bigger */
            fontSize: 16,
        }, []);
        this.editor.filePath = filePath;

        // Utility to load editor options
        const loadEditorOptions = (editorOptions: types.EditorOptions) => {
            // Feels consistent with https://code.visualstudio.com/Docs/customization/userandworkspace
            this.editor.getModel().updateOptions({
                insertSpaces: editorOptions.convertTabsToSpaces,
                tabSize: editorOptions.tabSize
            });
        }

        this.disposible.add(cast.editorOptionsChanged.on((res) => {
            if (res.filePath === this.props.filePath) {
                loadEditorOptions(res.editorOptions);
            }
        }));

        // load up the doc
        docCache.getLinkedDoc(this.props.filePath, this.editor).then(({ doc, editorOptions }) => {
            // Load editor options
            loadEditorOptions(editorOptions);

            if (this.props.preview) {
                this.gotoPreview(this.props.preview);
            }

            // linter
            // NOTE: done here because it depends on model :)
            this.disposible.add(linter.setup(this.editor));

            /** Tested */
            if (!this.props.readOnly) {
                this.disposible.add(testedMonaco.setup(this.editor));
            }

            /** Auto close tag */
            const ext = utils.getExt(this.props.filePath);
            if (ext === 'tsx') {
                this.disposible.add(autoCloseTag.setup(this.editor));
            }

            // Mark as ready and do anything that was waiting for ready to occur 🌹
            this.afterReadyQueue.forEach(cb => cb());
            this.ready = true;
            this.setState({ loading: false });
        })

        this.disposible.add(this.editor.onDidFocusEditor(this.focusChanged.bind(this, true)));
        this.disposible.add(this.editor.onDidBlurEditor(this.focusChanged.bind(this, false)));

        // cursor history
        if (!this.props.readOnly) {
            this.disposible.add(this.editor.onDidChangeCursorPosition(this.handleCursorActivity));
        }

        // live analysis
        this.disposible.add(liveAnalysis.setup(this.editor));

        // quick fix
        if (!this.props.readOnly) {
            this.disposible.add(quickFix.setup(this.editor));
        }

        // Git status
        this.disposible.add(gitStatus.setup(this.editor));

        // Docblockr
        this.disposible.add(docblockr.setup(this.editor));
    }

    componentWillUnmount() {
        super.componentWillUnmount();
        docCache.removeLinkedDoc(this.props.filePath, this.editor);
        this.editor.dispose();
        this.editor = null;
    }

    firstFocus = true;
    focus = () => {
        if (!this.ready && this.firstFocus) {
            this.firstFocus = false;
            this.afterReadyQueue.push(() => {
                this.resize();
                this.focus();
            });
        }
        else if (this.editor) {
            this.editor.focus();
        }
    }

    resize = () => {
        if (this.editor) {
            const before = this.editor.getDomNode().scrollHeight;
            this.refresh();
            const after = this.editor.getDomNode().scrollHeight;
            const worthRestoringScrollPosition = (after !== before) && (after != 0);

            /** Restore last scroll position on refresh after a blur */
            if (this.lastScrollPosition != undefined && worthRestoringScrollPosition) {
                setTimeout(() => {
                    this.editor.setScrollTop(this.lastScrollPosition);
                    // console.log(this.props.filePath, before, after, worthRestoringScrollPosition, this.lastScrollPosition); // DEBUG
                    this.lastScrollPosition = undefined;
                })
            }
        }
    }

    lastScrollPosition: number | undefined = undefined;
    willBlur() {
        this.lastScrollPosition = this.editor.getScrollTop();
        // console.log('Storing:', this.props.filePath, this.lastScrollPosition); // DEBUG
    }

    gotoPosition = (position: EditorPosition) => {
        this.afterReady(() => {
            this.lastScrollPosition = undefined; // Don't even think about restoring scroll position

            /** e.g. if the tab is already active we don't call `focus` from `gotoPosition` ... however it might not have focus */
            if (!this.editor.isFocused()) { this.editor.focus() }

            /** SetTimeout because if editor comes out of hidden state we goto position too fast and then the scroll position is off */
            setTimeout(() => monacoUtils.gotoPosition({ editor: this.editor, position }));
        });
    }

    private refresh = () => {
        this.editor.layout();
    }

    focusChanged = (focused) => {
        this.setState({
            isFocused: focused
        });
        this.props.onFocusChange && this.props.onFocusChange(focused);
    }

    getValue() {
        this.editor.getValue();
    }

	/**
	 * used to seed the initial search if coming out of hidden
	 */
    getSelectionSearchString(): string | undefined {
        let selection = this.editor.getSelection();

        if (selection.startLineNumber === selection.endLineNumber) {
            if (selection.isEmpty()) {
                let wordAtPosition = this.editor.getModel().getWordAtPosition(selection.getStartPosition());
                if (wordAtPosition) {
                    return wordAtPosition.word;
                }
            } else {
                return this.editor.getModel().getValueInRange(selection);
            }
        }

        return undefined;
    }

    search = (options: FindOptions) => {
        search.commands.search(this.editor, options);
    }

    hideSearch = () => {
        search.commands.hideSearch(this.editor);
    }

    findNext = (options: FindOptions) => {
        search.commands.findNext(this.editor, options);
    }

    findPrevious = (options: FindOptions) => {
        search.commands.findPrevious(this.editor, options);
    }

    replaceNext = (newText: string) => {
        search.commands.replaceNext(this.editor, newText);
    }

    replacePrevious = (newText: string) => {
        search.commands.replacePrevious(this.editor, newText);
    }

    replaceAll = (newText: string) => {
        search.commands.replaceAll(this.editor, newText);
    }

    handleCursorActivity = () => {
        let cursor = this.editor.getSelection();
        cursorHistory.addEntry({
            line: cursor.startLineNumber - 1,
            ch: cursor.startColumn - 1,
        });
    };

    render() {
        var className = 'ReactCodeEditor';
        if (this.state.isFocused) {
            className += ' ReactCodeEditor--focused';
        }
        const loadingStyle = {
            position: 'absolute', top: '45%', left: '45%', zIndex: 1,
            color: '#999',
            border: '5px solid #999',
            borderRadius: '5px',
            fontSize: '2rem',
            padding: '5px',
            transition: '.2s opacity',
            opacity: this.state.loading ? 1 : 0,
            pointerEvents: 'none',
        };
        return (
            <div className={className} style={csx.extend(csx.horizontal, csx.flex, { position: 'relative', maxWidth: '100%' })}>
                {!this.props.readOnly && <doctor.Doctor cm={this.editor} filePath={this.props.filePath} />}
                <div style={loadingStyle as any}>LOADING</div>
                <div ref="codeEditor" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }} />
                {!this.props.readOnly && <semanticView.SemanticView editor={this.editor} filePath={this.props.filePath} />}
            </div>
        );
    }

    componentWillReceiveProps(nextProps: Props) {
        // If next props are getting a preview then old props had them too (based on how we use preview)
        if (nextProps.preview && nextProps.preview.start !== this.props.preview.start) {
            this.gotoPreview(nextProps.preview);
        }
    }

    gotoPreview(preview: ts.TextSpan) {
        // Re-layout as for preview style editors monaco seems to render faster than CSS 🌹
        this.editor.layout();

        let pos = this.editor.getModel().getPositionAt(preview.start);
        this.editor.revealLineInCenterIfOutsideViewport(pos.lineNumber);
        this.editor.setPosition(pos);
    }
}
