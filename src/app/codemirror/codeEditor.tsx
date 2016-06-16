import * as ui from "../ui";
import * as csx from "csx";
import * as React from "react";
import {cast, server} from "../../socket/socketClient";
import * as docCache from "./mode/docCache";
import * as types from "../../common/types";
import * as cursorHistory from "../cursorHistory";
import * as search from "../monaco/search/monacoSearch";
import * as semanticView from "./addons/semanticView";
import * as monacoUtils from "../monaco/monacoUtils";
import * as gitStatus from "../monaco/addons/gitStatus";

// The monokai theme
require('./monokai.css');
// Any other style modifications
require('./codeEditor.css');

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

export class CodeEditor extends ui.BaseComponent<Props,{isFocused?:boolean, loading?: boolean}>{
	constructor(props){
		super(props);

		this.state = {
			isFocused: false,
			loading: true,
		};
	}

    // TODO: mon
	editor: monaco.editor.ICodeEditor;
	refs: {
		[string: string]: any;
		codeEditor: HTMLDivElement;
	}

	/** Ready after the doc is loaded */
	ready = false;
	afterReadyQueue:{():void}[] = [];
	/** If already ready it execs ... otherwise waits */
	afterReady = (cb:()=>void) => {
		if (this.ready) cb();
		else {
			this.afterReadyQueue.push(cb);
		}
	}

	componentDidMount () {

		var options: CodeMirror.EditorConfiguration = {
            // our extension
            filePath: this.props.filePath,
            readOnly: this.props.readOnly,

            keyMap: 'sublime',
            theme: 'monokai',
            indentUnit: 4,
			indentWithTabs: false,

			// Soft tabs (tabs to spaces):
			// https://github.com/codemirror/CodeMirror/issues/988#issuecomment-37692827
            extraKeys: {
                Tab: function(cm) {
                    if (cm.doc.somethingSelected()) {
                        return CodeMirror.Pass;
                    }
					if (cm.getOption("indentWithTabs")) {
						return CodeMirror.Pass;
					}
                    var spacesPerTab = cm.getOption("indentUnit");
                    var spacesToInsert = spacesPerTab - (cm.doc.getCursor("start").ch % spacesPerTab);
                    var spaces = Array(spacesToInsert + 1).join(" ");
                    cm.replaceSelection(spaces, "end", "+input");
                }
            },

			lineNumbers: true,
			foldGutter: true,
            gutters: ["CodeMirror-linenumbers"],

            // Active line addon
            styleActiveLine: true,

            // Match bracket addon
            matchBrackets: true,

            // Auto close brackets and strings
            autoCloseBrackets: true,

            // Match tags (great for tsx!)
            // It needs `tag` token to work (see code in `xml-fold.js` i.e. `/\btag\b/``)
            matchTags: {bothTags: true},

            // Text hover
            textHover: {
				delay: 50,
                // TODO: mon
				// getTextHover: (cm, data, e: MouseEvent) => {
	            //     if (data && data.pos) {
	            //         return this.getQuickInfo(data.pos);
	            //     }
	            // },
			},

			// Blaster
			// blastCode: { effect: 2 }, // `effect` can be 1 or 2

            /** Overcomes horizontal scrolling for now */
            lineWrapping: true,
        } as any;

        // setup hint / autocomplete options
        // TODO: mon
        // autocomplete.setupOptions(options, this.props.filePath);

        // fold
        (options as any).foldGutter = true;
        options.gutters.push("CodeMirror-foldgutter");

        // TODO: mon
        // live analysis
        // liveAnalysis.setupOptions(options);

        // quickfix
        if (!this.props.readOnly) {
            // TODO: mon
            // quickFix.setupOptions(options);
        }

        // TODO: mon
        // Git status
        // gitStatus.setupOptions(options);

        // TODO: mon
        // lint
        // linter.setupOptions(options, this.props.filePath);
        // also lint on errors changing
        // this.disposible.add(cast.errorsUpdated.on(()=> this.codeMirror && this.codeMirror.performLint()));
		// and initially
		// setTimeout(()=> this.codeMirror && this.codeMirror.performLint(),1000);

        var mountNode = this.refs.codeEditor;
        this.editor = monaco.editor.create(mountNode, {
            value: '...',
            theme: 'vs-dark vscode-theme-monokai-themes-Monokai-tmTheme',
			folding: true,
			autoClosingBrackets: true,
			wrappingColumn: 0,
			readOnly: false, // Never readonly ... even for readonly editors. Otherwise monaco doesn't highlight active line :)
			scrollBeyondLastLine: false, // Don't scroll by mouse where you can't scroll by keyboard :)
			formatOnType: true,
			contextmenu: false, // Disable context menu till we have it actually useful
			/** Since everything else in our UI is Square */
			roundedSelection: false,
            /** For git status, find results, errors */
            overviewRulerLanes: 3,
        }, []);
		this.editor.filePath = this.props.filePath;

		// Utility to load editor options
		const loadEditorOptions = (editorOptions:types.EditorOptions) => {
		    // Feels consistent with https://code.visualstudio.com/Docs/customization/userandworkspace
		    this.editor.getModel().updateOptions({
				insertSpaces: editorOptions.convertTabsToSpaces,
				tabSize: editorOptions.tabSize
			});
		}

		this.disposible.add(cast.editorOptionsChanged.on((res) => {
		    if (res.filePath === this.props.filePath){
		        loadEditorOptions(res.editorOptions);
		    }
		}));

        // load up the doc
        docCache.getLinkedDoc(this.props.filePath).then(({doc, editorOptions}) => {
			// Wire up the doc
			this.editor.setModel(doc);
			doc._editors.push(this.editor);

            // Load editor options
            loadEditorOptions(editorOptions);

            if (this.props.preview) {
                this.gotoPreview(this.props.preview);
            }

            // Mark as ready and do anything that was waiting for ready to occur 🌹
            this.afterReadyQueue.forEach(cb=>cb());
			this.ready = true;
			this.setState({loading:false});
		})

		this.disposible.add(this.editor.onDidFocusEditor(this.focusChanged.bind(this, true)));
		this.disposible.add(this.editor.onDidBlurEditor(this.focusChanged.bind(this, false)));

        // TODO: mon
		// this.codeMirror = CodeMirror.fromTextArea(textareaNode as any, options);
		// this.codeMirror.filePath = this.props.filePath;

        // TODO: mon
        // Make hint / autocomplete more aggresive
        // autocomplete.setupCodeMirror(this.codeMirror);

        // TODO: mon
        // this.disposible.add(onresize.on(() => this.refresh()));

        // cursor history
        if (!this.props.readOnly) {
            this.disposible.add(this.editor.onDidChangeCursorPosition(this.handleCursorActivity));
        }

        // TODO: mon
        // live analysis
        // this.disposible.add(liveAnalysis.setupCM(this.codeMirror));

        // TODO: mon
        // quick fix
        // if (!this.props.readOnly) {
        //     this.disposible.add(quickFix.setupCM(this.codeMirror));
        // }

        // Git status
        this.disposible.add(gitStatus.setup(this.editor));

        // TODO: mon
        // const loadEditorOptions = (editorOptions:types.EditorOptions) => {
        //     // Set editor options
        //     this.codeMirror.setOption('indentUnit', editorOptions.indentSize);
        //     this.codeMirror.setOption('tabSize', editorOptions.tabSize);
        //     this.codeMirror.setOption('indentWithTabs', !editorOptions.convertTabsToSpaces);
        // }

        // TODO: mon
        // Subscribe to changing editor options
        // this.disposible.add(cast.editorOptionsChanged.on((res) => {
        //     if (res.filePath === this.props.filePath){
        //         loadEditorOptions(res.editorOptions);
        //     }
        // }));

        // TODO: mon
		// Load the document
        // docCache.getLinkedDoc(this.props.filePath).then(({doc, editorOptions})=>{
        //     this.codeMirror.swapDoc(doc);
        //
        //     // Load editor options
		// 	loadEditorOptions(editorOptions);
        //
        //     if (this.props.preview) {
        //         let preview = this.props.preview;
        //         let from = doc.posFromIndex(preview.start);
        //         let to = doc.posFromIndex(preview.start + preview.length);
        //         cmUtils.jumpToLine({
        //             line: from.line,
        //             ch: from.ch,
        //             editor: this.codeMirror
        //         });
        //     }
        //
		// 	this.afterReadyQueue.forEach(cb=>cb());
		// 	this.ready = true;
		// 	this.setState({loading:false});
        // });
	}

	componentWillUnmount () {
		super.componentWillUnmount();
		// Note : we don't remove the model from the doc cache for fast reopening
        this.editor.getModel()._editors = this.editor.getModel()._editors.filter(e => e != this.editor);
		this.editor.dispose();
		this.editor = null;
	}

    // TODO: mon
    // getQuickInfo = (pos: CodeMirror.Position): Promise<string | HTMLElement> => {
    //     if (
    //         state.inActiveProjectFilePath(this.props.filePath)
    //         || utils.isSupportedConfigFileForHover(this.props.filePath)
    //     ) {
    //         return server.quickInfo({ filePath: this.props.filePath, position: this.codeMirror.getDoc().indexFromPos(pos) }).then(resp => {
    //             if (!resp.valid) return;
    //
    //             var message = '';
    //             if (resp.errors.length) {
    //                 message = message + `🐛 <i>${resp.errors.map(e => escape(e.message)).join('<br/>')}</i><br/>`
    //             }
    //
    //             if (resp.info) {
    //                 message = message + `<b>${escape(resp.info.name)}</b>`;
    //                 if (resp.info.comment) {
    //                     message = message + `<br/>${toHtml(resp.info.comment)}`;
    //                 }
    //             }
    //
    //             let div = document.createElement('div');
    //             div.innerHTML = message;
    //             return div;
    //         });
    //     }
    // };

    // TODO: mon
	// getCodeMirror () {
	// 	return this.codeMirror;
	// }

	firstFocus = true;
	focus = () => {
		if (!this.ready && this.firstFocus) {
			this.firstFocus = false;
			this.afterReadyQueue.push(()=>{
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
				setTimeout(()=>{
					this.editor.setScrollTop(this.lastScrollPosition);
					this.lastScrollPosition = undefined;
					// console.log(this.props.filePath, before, after, worthRestoringScrollPosition, this.lastScrollPosition); // DEBUG
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
            if (!this.editor.isFocused()) { this.editor.focus() }
			monacoUtils.gotoPosition({editor:this.editor,position});
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

	render () {
		var className = 'ReactCodeMirror';
		if (this.state.isFocused) {
			className += ' ReactCodeMirror--focused';
        }
        const loadingStyle = {
            position: 'absolute', top: '45%', left: '45%', zIndex: 1,
			color: '#999',
			border: '5px solid #999',
			borderRadius: '5px',
			fontSize:'2rem',
			padding: '5px',
			transition: '.2s opacity',
			opacity: this.state.loading ? 1: 0,
			pointerEvents: 'none',
        };
		return (
			<div className={className} style={csx.extend(csx.horizontal,csx.flex,{position:'relative', maxWidth:'100%'})}>
                <div style={loadingStyle}>LOADING</div>
                <div ref="codeEditor" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }} />
                {!this.props.readOnly && <semanticView.SemanticView editor={this.editor} filePath={this.props.filePath}/>}
			</div>
		);
	}

    componentWillReceiveProps(nextProps:Props){
        // If next props are getting a preview then old props had them too (based on how we use preview)
        if (nextProps.preview && nextProps.preview.start !== this.props.preview.start) {
            this.gotoPreview(nextProps.preview);
        }
    }

    gotoPreview(preview: ts.TextSpan){
        // Re-layout as for preview style editors monaco seems to render faster than CSS 🌹
        this.editor.layout();

        let pos = this.editor.getModel().getPositionAt(preview.start);
        this.editor.revealLineInCenterIfOutsideViewport(pos.lineNumber);
        this.editor.setPosition(pos);
    }
}
