import * as ui from "../ui";
import * as csx from "csx";
import * as React from "react";


interface Props {
	onFocusChange?: (focused: boolean) => any;
	readOnly?: boolean | "nocursor";
	preview?: ts.TextSpan;
	filePath: string;
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
            value: [
                'function x() {',
                '\tconsole.log("Hello world!");',
                '}'
            ].join('\n'),
            language: 'javascript',
        }, []);

        // TODO: mon
		// this.codeMirror = CodeMirror.fromTextArea(textareaNode as any, options);
		// this.codeMirror.filePath = this.props.filePath;
		// this.codeMirror.on('focus', this.focusChanged.bind(this, true));
		// this.codeMirror.on('blur', this.focusChanged.bind(this, false));

        // TODO: mon
        // Make hint / autocomplete more aggresive
        // autocomplete.setupCodeMirror(this.codeMirror);

        // TODO: mon
        // this.disposible.add(onresize.on(() => this.refresh()));

        // TODO: mon
        // cursor history
        // if (!this.props.readOnly) {
        //     this.codeMirror.on('cursorActivity', this.handleCursorActivity);
        //     this.disposible.add({ dispose: () => this.codeMirror.off('cursorActivity', this.handleCursorActivity) });
        // }

        // TODO: mon
        // live analysis
        // this.disposible.add(liveAnalysis.setupCM(this.codeMirror));

        // TODO: mon
        // quick fix
        // if (!this.props.readOnly) {
        //     this.disposible.add(quickFix.setupCM(this.codeMirror));
        // }

        // TODO: mon
        // Git status
        // this.disposible.add(gitStatus.setupCM(this.codeMirror));

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
		// todo: is there a lighter-weight way to remove the cm instance?
		// if (this.codeMirror) {
		// 	this.codeMirror.toTextArea();
		// 	/**
		// 	 * Very hacky way to unlink docs from CM
		// 	 * If we don't do this then the doc stays in memory and so does cm :-/
		// 	 */
		// 	(this.codeMirror.getDoc() as any).cm = null;
		// }
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

	focus = () => {
        if (this.editor) {
            this.editor.focus();
        }
	}

    resize = () => {
        if (this.editor) {
            this.refresh();
		}
    }

    gotoPosition = (position: EditorPosition) => {
        // TODO: mon
        // this.afterReady(()=>{
        //     cmUtils.jumpToLine({ line: position.line, ch: position.ch, editor: this.codeMirror });
        //     this.codeMirror.focus();
		// });
    }

    private refresh = () => {
        // TODO: mon
        console.log('here');
        this.editor.layout();
    }

    focusChanged = (focused) => {
        this.setState({
            isFocused: focused
        });
		this.props.onFocusChange && this.props.onFocusChange(focused);
	}

    getValue(){
        return '';
        // TODO: mon
        // return this.codeMirror.getDoc().getValue();
    }

    search = (options: FindOptions) => {
        // TODO: mon
        // search.commands.search(this.codeMirror, utils.findOptionsToQueryRegex(options));
    }

    hideSearch = () => {
        // TODO: mon
        // search.commands.hideSearch(this.codeMirror);
    }

    findNext = (options: FindOptions) => {
        // TODO: mon
        // search.commands.findNext(this.codeMirror, utils.findOptionsToQueryRegex(options));
    }

    findPrevious = (options: FindOptions) => {
        // TODO: mon
        // search.commands.findPrevious(this.codeMirror, utils.findOptionsToQueryRegex(options));
    }

    replaceNext = (newText: string) => {
        // TODO: mon
        // search.commands.replaceNext(this.codeMirror, newText);
    }

	replacePrevious = (newText: string) => {
        // TODO: mon
		// search.commands.replacePrevious(this.codeMirror, newText);
	}

    replaceAll = (newText: string) => {
        // TODO: mon
        // search.commands.replaceAll(this.codeMirror, newText);
    }

    handleCursorActivity = () => {
        // TODO: mon
        // let cursor = this.codeMirror.getDoc().getCursor();
        // cursorLocation.addEntry(cursor);
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
			opacity: this.state.loading ? 1: 0
        };
		return (
			<div className={className} style={csx.extend(csx.horizontal,csx.flex,{position:'relative', maxWidth:'100%'})}>
                <div ref="codeEditor" style={{ display: 'flex', flexDirection: 'column', flex: 1 }} />
			</div>
		);
	}
}
