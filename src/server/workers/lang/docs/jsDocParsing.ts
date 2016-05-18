/**
 * NOTE: Pulled straight out of typedoc 🌹
 * https://github.com/TypeStrong/typedoc/blob/2e855cf8c62c7813ac62cb1ef911c9a0c5e034c2/src/lib/converter/factories/comment.ts
 */

/**
 * Returns the parsed comment for a given node.
 */
export function getParsedComment(node: ts.Node, sourceFile: ts.SourceFile): string | null {
    const rawComment = getRawComment(node, sourceFile);
    if (!rawComment) {
        return rawComment;
    }
    return parseComment(rawComment);
}

/**
 * Return the raw comment string for the given node.
 *
 * @param node  The node whose comment should be resolved.
 * @returns     The raw comment string or NULL if no comment could be found.
 */
export function getRawComment(node: ts.Node, sourceFile: ts.SourceFile): string | null {
    if (node.parent && node.parent.kind === ts.SyntaxKind.VariableDeclarationList) {
        node = node.parent.parent;
    } else if (node.kind === ts.SyntaxKind.ModuleDeclaration) {
        if (!isTopmostModuleDeclaration(<ts.ModuleDeclaration>node)) {
            return null;
        } else {
            node = getRootModuleDeclaration(<ts.ModuleDeclaration>node);
        }
    }

    var comments = ts.getJsDocComments(node, sourceFile);
    if (comments && comments.length) {
        var comment: ts.CommentRange;
        if (node.kind == ts.SyntaxKind.SourceFile) {
            if (comments.length == 1) return null;
            comment = comments[0];
        } else {
            comment = comments[comments.length - 1];
        }

        return sourceFile.text.substring(comment.pos, comment.end);
    } else {
        return null;
    }
}

/**
 * Return the root module declaration of the given module declaration.
 *
 * In the following example this function would always return module
 * <code>A</code> no matter which of the modules was passed in.
 *
 * ```
 * module A.B.C { }
 * ```
 */
function getRootModuleDeclaration(node: ts.ModuleDeclaration): ts.Node {
    while (node.parent && node.parent.kind == ts.SyntaxKind.ModuleDeclaration) {
        let parent = <ts.ModuleDeclaration>node.parent;
        if (node.name.pos == parent.name.end + 1) {
            node = parent;
        } else {
            break;
        }
    }

    return node;
}

/**
 * Check whether the given module declaration is the topmost.
 *
 * This funtion returns TRUE if there is no trailing module defined, in
 * the following example this would be the case only for module <code>C</code>.
 *
 * ```
 * module A.B.C { }
 * ```
 *
 * @param node  The module definition that should be tested.
 * @return TRUE if the given node is the topmost module declaration, FALSE otherwise.
 */
function isTopmostModuleDeclaration(node: ts.ModuleDeclaration): boolean {
    if (node.nextContainer && node.nextContainer.kind == ts.SyntaxKind.ModuleDeclaration) {
        let next = <ts.ModuleDeclaration>node.nextContainer;
        if (node.name.end + 1 == next.name.pos) {
            return false;
        }
    }

    return true;
}

/**
 * Modified from original to return `string` instead of `Comment` class
 * We lose `tag` information, but that is fine by me for now.
 */
export function parseComment(text: string): string {
    let comment = '';

    function consumeTypeData(line: string): string {
        line = line.replace(/^\{[^\}]*\}+/, '');
        line = line.replace(/^\[[^\[][^\]]*\]+/, '');
        return line.trim();
    }

    function readBareLine(line: string) {
        comment += (comment == '' ? '' : '\n') + line;
    }

    function readLine(line: string) {
        line = line.replace(/^\s*\*? ?/, '');
        line = line.replace(/\s*$/, '');
        readBareLine(line);
    }

    // text = text.replace(/^\s*\/\*+\s*(\r\n?|\n)/, '');
    // text = text.replace(/(\r\n?|\n)\s*\*+\/\s*$/, '');
    text = text.replace(/^\s*\/\*+/, '');
    text = text.replace(/\*+\/\s*$/, '');
    text.split(/\r\n?|\n/).forEach(readLine);

    return comment;
}
