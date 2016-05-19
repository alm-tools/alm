/**
 * This is the backend for the uml diagram view
 *
 * Based on the tsviz project https://github.com/joaompneves/tsviz 🌹
 */

/** Imports */
import * as tsAnalyzer from "./tsAnalyzer";
import * as utils from "../../../../common/utils";
import * as types from "../../../../common/types";
import {getDocumentedTypeLocation} from "../modules/astUtils";

/** We just use the *active* project if any */
import * as activeProject from "../activeProject";
let getProject = activeProject.GetProject.getCurrentIfAny;

/**
 * Get a uml diagram structure for a file
 */
export function getUmlDiagramForFile(query: { filePath: string }) : Promise<{classes: types.UMLClass[]}> {
    let project = getProject();
    const sourceFile = project.getProjectSourceFiles().find(f => f.fileName === query.filePath);
    const program = project.languageService.getProgram();

    // const modules = tsAnalyzer.collectInformation(program, sourceFile);
    // console.log(modules);

    const classes = analyzeFile({ sourceFile, program });

    // TODO: sort by base classes (i.e. the class that has the lowest length of extend)

    return utils.resolve({ classes });
}


function analyzeFile({sourceFile, program}: { sourceFile: ts.SourceFile, program: ts.Program }): types.UMLClass[] {
    const result: types.UMLClass[] = [];
    const typeChecker = program.getTypeChecker();

    ts.forEachChild(sourceFile, node => {
        if (node.kind == ts.SyntaxKind.ClassDeclaration) {
            result.push(transformClass(node as ts.ClassDeclaration, sourceFile, program));
        }

        // TODO: potentially support looking into `a.b.c` style namespaces as well
    });

    return result;
}

/**
 * Various Transformers
 */

function transformClass(node: ts.ClassDeclaration, sourceFile: ts.SourceFile, program: ts.Program): types.UMLClass {
    const result: types.UMLClass = {
        name: node.name.text,
        icon: types.IconType.Class,
        location: getDocumentedTypeLocation(sourceFile, node.name.pos),

        members: [],
        extends: [],
    }
    if (node.typeParameters) {
        result.icon = types.IconType.ClassGeneric;
    }

    /** Collect members  */
    ts.forEachChild(node, (node) => {
        if (node.kind == ts.SyntaxKind.Constructor) {
            result.members.push(transformClassConstructor(node as ts.ConstructorDeclaration, sourceFile));
        }
        // TODO:
        // if (node.kind == ts.SyntaxKind.PropertyDeclaration) {
        //     subItems.push(transformClassProperty(node as ts.PropertyDeclaration, sourceFile));
        // }
        // if (node.kind == ts.SyntaxKind.MethodDeclaration) {
        //     subItems.push(transformClassMethod(node as ts.MethodDeclaration, sourceFile));
        // }
        // if (node.kind == ts.SyntaxKind.IndexSignature) {
        //     subItems.push(transformClassIndexSignature(node as ts.IndexSignatureDeclaration, sourceFile));
        // }
    });

    return result;
}

/** Class Constructor */
function transformClassConstructor(node: ts.ConstructorDeclaration, sourceFile: ts.SourceFile): types.UMLClassMember {
    const name = "constructor";
    let icon = types.IconType.ClassConstructor;
    const location = getDocumentedTypeLocation(sourceFile, node.pos);
    const result: types.UMLClassMember = {
        name,
        icon,
        location,

        visibility: types.UMLClassMemberVisibility.Public,
        lifetime: types.UMLClassMemberLifeTime.Instance,
    }

    return result;
}
