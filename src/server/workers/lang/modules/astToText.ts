
/**
 * Things we care about:
 * name , kind , text
 */
// Inspired by `ts.forEachChild`:
// https://github.com/Microsoft/TypeScript/blob/65cbd91667acf890f21a3527b3647c7bc994ca32/src/compiler/parser.ts#L43-L320

import {syntaxKindToString} from "./astUtils";
import {Types} from "../../../../socket/socketContract";
type NodeDisplay = Types.NodeDisplay;

export function astToText(srcFile: ts.Node) {

    //// A useful function for debugging
    // aggregate(srcFile, 0);
    // function aggregate(node: ts.Node, depth: number): void {
    //     console.error(node.kind, (node.name && node.name.text), (node.parent), depth, node);
    //     ts.forEachChild(node, (node) => aggregate(node, depth + 1));
    // }

    var nodeIndex = 0;
    function nodeToNodeDisplay(node: ts.Node, depth: number): NodeDisplay {

        var kind = syntaxKindToString(node.kind);

        var children = [];
        ts.forEachChild(node, (cNode) => {
            var child = nodeToNodeDisplay(cNode, depth + 1);
            children.push(child);
        });

        var ret: NodeDisplay = {
            kind,
            children,
            pos: node.pos,
            end: node.end,
            depth,
            nodeIndex,
            rawJson: prettyJSONNoParent(node)
        };

        // each time we get called index is incremented
        nodeIndex++;
        return ret;
    }

    var root = nodeToNodeDisplay(srcFile, 0);

    return root;
}

export function astToTextFull(srcFile: ts.Node) {

    //// A useful function for debugging
    // aggregate(srcFile, 0);
    // function aggregate(node: ts.Node, depth: number): void {
    //     console.error(node.kind, (node.name && node.name.text), (node.parent), depth, node);
    //     ts.forEachChild(node, (node) => aggregate(node, depth + 1));
    // }

    var nodeIndex = 0;
    function nodeToNodeDisplay(node: ts.Node, depth: number): NodeDisplay {

        var kind = syntaxKindToString(node.kind);

        var children = [];
         node.getChildren().forEach((cNode) => {
            var child = nodeToNodeDisplay(cNode, depth + 1);
            children.push(child);
        });

        var ret: NodeDisplay = {
            kind,
            children,
            pos: node.pos,
            end: node.end,
            depth,
            nodeIndex,
            rawJson: prettyJSONNoParent(node)
        };

        // each time we get called index is incremented
        nodeIndex++;
        return ret;
    }

    var root = nodeToNodeDisplay(srcFile, 0);

    return root;
}

function prettyJSONNoParent(object: any): string {
    var cache = [];
    var value = JSON.stringify(object,
        // fixup circular reference
        function(key, value) {
            if (key == 'parent'){
                return;
            }
            if (typeof value === 'object' && value !== null) {
                if (cache.indexOf(value) !== -1) {
                    // Circular reference found, discard key
                    return;
                }
                // Store value in our collection
                cache.push(value);
            }
            return value;
        },
    // indent 4 spaces
        4);
    cache = null;
    return value;
}

// import {Node,SyntaxKind,visitNode} from "typescript";
//
// // Invokes a callback for each child of the given node. The 'cbNode' callback is invoked for all child nodes
//    // stored in properties. If a 'cbNodes' callback is specified, it is invoked for embedded arrays; otherwise,
//    // embedded arrays are flattened and the 'cbNode' callback is invoked for each element. If a callback returns
//    // a truthy value, iteration stops and that value is returned. Otherwise, undefined is returned.
//    export function forEachChild<T>(node: Node, cbNode: (node: Node) => T, cbNodeArray?: (nodes: Node[]) => T): T {
//        if (!node) {
//            return;
//        }
//        // The visitXXX functions could be written as local functions that close over the cbNode and cbNodeArray
//        // callback parameters, but that causes a closure allocation for each invocation with noticeable effects
//        // on performance.
//        let visitNodes: (cb: (node: Node | Node[]) => T, nodes: Node[]) => T = cbNodeArray ? visitNodeArray : visitEachNode;
//        let cbNodes = cbNodeArray || cbNode;
//        switch (node.kind) {
//            case SyntaxKind.QualifiedName:
//                return visitNode(cbNode, (<QualifiedName>node).left) ||
//                    visitNode(cbNode, (<QualifiedName>node).right);
//            case SyntaxKind.TypeParameter:
//                return visitNode(cbNode, (<TypeParameterDeclaration>node).name) ||
//                    visitNode(cbNode, (<TypeParameterDeclaration>node).constraint) ||
//                    visitNode(cbNode, (<TypeParameterDeclaration>node).expression);
//            case SyntaxKind.Parameter:
//            case SyntaxKind.PropertyDeclaration:
//            case SyntaxKind.PropertySignature:
//            case SyntaxKind.PropertyAssignment:
//            case SyntaxKind.ShorthandPropertyAssignment:
//            case SyntaxKind.VariableDeclaration:
//            case SyntaxKind.BindingElement:
//                return visitNodes(cbNodes, node.decorators) ||
//                    visitNodes(cbNodes, node.modifiers) ||
//                    visitNode(cbNode, (<VariableLikeDeclaration>node).propertyName) ||
//                    visitNode(cbNode, (<VariableLikeDeclaration>node).dotDotDotToken) ||
//                    visitNode(cbNode, (<VariableLikeDeclaration>node).name) ||
//                    visitNode(cbNode, (<VariableLikeDeclaration>node).questionToken) ||
//                    visitNode(cbNode, (<VariableLikeDeclaration>node).type) ||
//                    visitNode(cbNode, (<VariableLikeDeclaration>node).initializer);
//            case SyntaxKind.FunctionType:
//            case SyntaxKind.ConstructorType:
//            case SyntaxKind.CallSignature:
//            case SyntaxKind.ConstructSignature:
//            case SyntaxKind.IndexSignature:
//                return visitNodes(cbNodes, node.decorators) ||
//                    visitNodes(cbNodes, node.modifiers) ||
//                    visitNodes(cbNodes, (<SignatureDeclaration>node).typeParameters) ||
//                    visitNodes(cbNodes, (<SignatureDeclaration>node).parameters) ||
//                    visitNode(cbNode, (<SignatureDeclaration>node).type);
//            case SyntaxKind.MethodDeclaration:
//            case SyntaxKind.MethodSignature:
//            case SyntaxKind.Constructor:
//            case SyntaxKind.GetAccessor:
//            case SyntaxKind.SetAccessor:
//            case SyntaxKind.FunctionExpression:
//            case SyntaxKind.FunctionDeclaration:
//            case SyntaxKind.ArrowFunction:
//                return visitNodes(cbNodes, node.decorators) ||
//                    visitNodes(cbNodes, node.modifiers) ||
//                    visitNode(cbNode, (<FunctionLikeDeclaration>node).asteriskToken) ||
//                    visitNode(cbNode, (<FunctionLikeDeclaration>node).name) ||
//                    visitNode(cbNode, (<FunctionLikeDeclaration>node).questionToken) ||
//                    visitNodes(cbNodes, (<FunctionLikeDeclaration>node).typeParameters) ||
//                    visitNodes(cbNodes, (<FunctionLikeDeclaration>node).parameters) ||
//                    visitNode(cbNode, (<FunctionLikeDeclaration>node).type) ||
//                    visitNode(cbNode, (<ArrowFunction>node).equalsGreaterThanToken) ||
//                    visitNode(cbNode, (<FunctionLikeDeclaration>node).body);
//            case SyntaxKind.TypeReference:
//                return visitNode(cbNode, (<TypeReferenceNode>node).typeName) ||
//                    visitNodes(cbNodes, (<TypeReferenceNode>node).typeArguments);
//            case SyntaxKind.TypeQuery:
//                return visitNode(cbNode, (<TypeQueryNode>node).exprName);
//            case SyntaxKind.TypeLiteral:
//                return visitNodes(cbNodes, (<TypeLiteralNode>node).members);
//            case SyntaxKind.ArrayType:
//                return visitNode(cbNode, (<ArrayTypeNode>node).elementType);
//            case SyntaxKind.TupleType:
//                return visitNodes(cbNodes, (<TupleTypeNode>node).elementTypes);
//            case SyntaxKind.UnionType:
//                return visitNodes(cbNodes, (<UnionTypeNode>node).types);
//            case SyntaxKind.ParenthesizedType:
//                return visitNode(cbNode, (<ParenthesizedTypeNode>node).type);
//            case SyntaxKind.ObjectBindingPattern:
//            case SyntaxKind.ArrayBindingPattern:
//                return visitNodes(cbNodes, (<BindingPattern>node).elements);
//            case SyntaxKind.ArrayLiteralExpression:
//                return visitNodes(cbNodes, (<ArrayLiteralExpression>node).elements);
//            case SyntaxKind.ObjectLiteralExpression:
//                return visitNodes(cbNodes, (<ObjectLiteralExpression>node).properties);
//            case SyntaxKind.PropertyAccessExpression:
//                return visitNode(cbNode, (<PropertyAccessExpression>node).expression) ||
//                    visitNode(cbNode, (<PropertyAccessExpression>node).dotToken) ||
//                    visitNode(cbNode, (<PropertyAccessExpression>node).name);
//            case SyntaxKind.ElementAccessExpression:
//                return visitNode(cbNode, (<ElementAccessExpression>node).expression) ||
//                    visitNode(cbNode, (<ElementAccessExpression>node).argumentExpression);
//            case SyntaxKind.CallExpression:
//            case SyntaxKind.NewExpression:
//                return visitNode(cbNode, (<CallExpression>node).expression) ||
//                    visitNodes(cbNodes, (<CallExpression>node).typeArguments) ||
//                    visitNodes(cbNodes, (<CallExpression>node).arguments);
//            case SyntaxKind.TaggedTemplateExpression:
//                return visitNode(cbNode, (<TaggedTemplateExpression>node).tag) ||
//                    visitNode(cbNode, (<TaggedTemplateExpression>node).template);
//            case SyntaxKind.TypeAssertionExpression:
//                return visitNode(cbNode, (<TypeAssertion>node).type) ||
//                    visitNode(cbNode, (<TypeAssertion>node).expression);
//            case SyntaxKind.ParenthesizedExpression:
//                return visitNode(cbNode, (<ParenthesizedExpression>node).expression);
//            case SyntaxKind.DeleteExpression:
//                return visitNode(cbNode, (<DeleteExpression>node).expression);
//            case SyntaxKind.TypeOfExpression:
//                return visitNode(cbNode, (<TypeOfExpression>node).expression);
//            case SyntaxKind.VoidExpression:
//                return visitNode(cbNode, (<VoidExpression>node).expression);
//            case SyntaxKind.PrefixUnaryExpression:
//                return visitNode(cbNode, (<PrefixUnaryExpression>node).operand);
//            case SyntaxKind.YieldExpression:
//                return visitNode(cbNode, (<YieldExpression>node).asteriskToken) ||
//                    visitNode(cbNode, (<YieldExpression>node).expression);
//            case SyntaxKind.PostfixUnaryExpression:
//                return visitNode(cbNode, (<PostfixUnaryExpression>node).operand);
//            case SyntaxKind.BinaryExpression:
//                return visitNode(cbNode, (<BinaryExpression>node).left) ||
//                    visitNode(cbNode, (<BinaryExpression>node).operatorToken) ||
//                    visitNode(cbNode, (<BinaryExpression>node).right);
//            case SyntaxKind.ConditionalExpression:
//                return visitNode(cbNode, (<ConditionalExpression>node).condition) ||
//                    visitNode(cbNode, (<ConditionalExpression>node).questionToken) ||
//                    visitNode(cbNode, (<ConditionalExpression>node).whenTrue) ||
//                    visitNode(cbNode, (<ConditionalExpression>node).colonToken) ||
//                    visitNode(cbNode, (<ConditionalExpression>node).whenFalse);
//            case SyntaxKind.SpreadElementExpression:
//                return visitNode(cbNode, (<SpreadElementExpression>node).expression);
//            case SyntaxKind.Block:
//            case SyntaxKind.ModuleBlock:
//                return visitNodes(cbNodes, (<Block>node).statements);
//            case SyntaxKind.SourceFile:
//                return visitNodes(cbNodes, (<SourceFile>node).statements) ||
//                    visitNode(cbNode, (<SourceFile>node).endOfFileToken);
//            case SyntaxKind.VariableStatement:
//                return visitNodes(cbNodes, node.decorators) ||
//                    visitNodes(cbNodes, node.modifiers) ||
//                    visitNode(cbNode, (<VariableStatement>node).declarationList);
//            case SyntaxKind.VariableDeclarationList:
//                return visitNodes(cbNodes, (<VariableDeclarationList>node).declarations);
//            case SyntaxKind.ExpressionStatement:
//                return visitNode(cbNode, (<ExpressionStatement>node).expression);
//            case SyntaxKind.IfStatement:
//                return visitNode(cbNode, (<IfStatement>node).expression) ||
//                    visitNode(cbNode, (<IfStatement>node).thenStatement) ||
//                    visitNode(cbNode, (<IfStatement>node).elseStatement);
//            case SyntaxKind.DoStatement:
//                return visitNode(cbNode, (<DoStatement>node).statement) ||
//                    visitNode(cbNode, (<DoStatement>node).expression);
//            case SyntaxKind.WhileStatement:
//                return visitNode(cbNode, (<WhileStatement>node).expression) ||
//                    visitNode(cbNode, (<WhileStatement>node).statement);
//            case SyntaxKind.ForStatement:
//                return visitNode(cbNode, (<ForStatement>node).initializer) ||
//                    visitNode(cbNode, (<ForStatement>node).condition) ||
//                    visitNode(cbNode, (<ForStatement>node).iterator) ||
//                    visitNode(cbNode, (<ForStatement>node).statement);
//            case SyntaxKind.ForInStatement:
//                return visitNode(cbNode, (<ForInStatement>node).initializer) ||
//                    visitNode(cbNode, (<ForInStatement>node).expression) ||
//                    visitNode(cbNode, (<ForInStatement>node).statement);
//            case SyntaxKind.ForOfStatement:
//                return visitNode(cbNode, (<ForOfStatement>node).initializer) ||
//                    visitNode(cbNode, (<ForOfStatement>node).expression) ||
//                    visitNode(cbNode, (<ForOfStatement>node).statement);
//            case SyntaxKind.ContinueStatement:
//            case SyntaxKind.BreakStatement:
//                return visitNode(cbNode, (<BreakOrContinueStatement>node).label);
//            case SyntaxKind.ReturnStatement:
//                return visitNode(cbNode, (<ReturnStatement>node).expression);
//            case SyntaxKind.WithStatement:
//                return visitNode(cbNode, (<WithStatement>node).expression) ||
//                    visitNode(cbNode, (<WithStatement>node).statement);
//            case SyntaxKind.SwitchStatement:
//                return visitNode(cbNode, (<SwitchStatement>node).expression) ||
//                    visitNode(cbNode, (<SwitchStatement>node).caseBlock);
//            case SyntaxKind.CaseBlock:
//                return visitNodes(cbNodes, (<CaseBlock>node).clauses);
//            case SyntaxKind.CaseClause:
//                return visitNode(cbNode, (<CaseClause>node).expression) ||
//                    visitNodes(cbNodes, (<CaseClause>node).statements);
//            case SyntaxKind.DefaultClause:
//                return visitNodes(cbNodes, (<DefaultClause>node).statements);
//            case SyntaxKind.LabeledStatement:
//                return visitNode(cbNode, (<LabeledStatement>node).label) ||
//                    visitNode(cbNode, (<LabeledStatement>node).statement);
//            case SyntaxKind.ThrowStatement:
//                return visitNode(cbNode, (<ThrowStatement>node).expression);
//            case SyntaxKind.TryStatement:
//                return visitNode(cbNode, (<TryStatement>node).tryBlock) ||
//                    visitNode(cbNode, (<TryStatement>node).catchClause) ||
//                    visitNode(cbNode, (<TryStatement>node).finallyBlock);
//            case SyntaxKind.CatchClause:
//                return visitNode(cbNode, (<CatchClause>node).variableDeclaration) ||
//                    visitNode(cbNode, (<CatchClause>node).block);
//            case SyntaxKind.Decorator:
//                return visitNode(cbNode, (<Decorator>node).expression);
//            case SyntaxKind.ClassDeclaration:
//            case SyntaxKind.ClassExpression:
//                return visitNodes(cbNodes, node.decorators) ||
//                    visitNodes(cbNodes, node.modifiers) ||
//                    visitNode(cbNode, (<ClassLikeDeclaration>node).name) ||
//                    visitNodes(cbNodes, (<ClassLikeDeclaration>node).typeParameters) ||
//                    visitNodes(cbNodes, (<ClassLikeDeclaration>node).heritageClauses) ||
//                    visitNodes(cbNodes, (<ClassLikeDeclaration>node).members);
//            case SyntaxKind.InterfaceDeclaration:
//                return visitNodes(cbNodes, node.decorators) ||
//                    visitNodes(cbNodes, node.modifiers) ||
//                    visitNode(cbNode, (<InterfaceDeclaration>node).name) ||
//                    visitNodes(cbNodes, (<InterfaceDeclaration>node).typeParameters) ||
//                    visitNodes(cbNodes, (<ClassDeclaration>node).heritageClauses) ||
//                    visitNodes(cbNodes, (<InterfaceDeclaration>node).members);
//            case SyntaxKind.TypeAliasDeclaration:
//                return visitNodes(cbNodes, node.decorators) ||
//                    visitNodes(cbNodes, node.modifiers) ||
//                    visitNode(cbNode, (<TypeAliasDeclaration>node).name) ||
//                    visitNode(cbNode, (<TypeAliasDeclaration>node).type);
//            case SyntaxKind.EnumDeclaration:
//                return visitNodes(cbNodes, node.decorators) ||
//                    visitNodes(cbNodes, node.modifiers) ||
//                    visitNode(cbNode, (<EnumDeclaration>node).name) ||
//                    visitNodes(cbNodes, (<EnumDeclaration>node).members);
//            case SyntaxKind.EnumMember:
//                return visitNode(cbNode, (<EnumMember>node).name) ||
//                    visitNode(cbNode, (<EnumMember>node).initializer);
//            case SyntaxKind.ModuleDeclaration:
//                return visitNodes(cbNodes, node.decorators) ||
//                    visitNodes(cbNodes, node.modifiers) ||
//                    visitNode(cbNode, (<ModuleDeclaration>node).name) ||
//                    visitNode(cbNode, (<ModuleDeclaration>node).body);
//            case SyntaxKind.ImportEqualsDeclaration:
//                return visitNodes(cbNodes, node.decorators) ||
//                    visitNodes(cbNodes, node.modifiers) ||
//                    visitNode(cbNode, (<ImportEqualsDeclaration>node).name) ||
//                    visitNode(cbNode, (<ImportEqualsDeclaration>node).moduleReference);
//            case SyntaxKind.ImportDeclaration:
//                return visitNodes(cbNodes, node.decorators) ||
//                    visitNodes(cbNodes, node.modifiers) ||
//                    visitNode(cbNode, (<ImportDeclaration>node).importClause) ||
//                    visitNode(cbNode, (<ImportDeclaration>node).moduleSpecifier);
//            case SyntaxKind.ImportClause:
//                return visitNode(cbNode, (<ImportClause>node).name) ||
//                    visitNode(cbNode, (<ImportClause>node).namedBindings);
//            case SyntaxKind.NamespaceImport:
//                return visitNode(cbNode, (<NamespaceImport>node).name);
//            case SyntaxKind.NamedImports:
//            case SyntaxKind.NamedExports:
//                return visitNodes(cbNodes, (<NamedImportsOrExports>node).elements);
//            case SyntaxKind.ExportDeclaration:
//                return visitNodes(cbNodes, node.decorators) ||
//                    visitNodes(cbNodes, node.modifiers) ||
//                    visitNode(cbNode, (<ExportDeclaration>node).exportClause) ||
//                    visitNode(cbNode, (<ExportDeclaration>node).moduleSpecifier);
//            case SyntaxKind.ImportSpecifier:
//            case SyntaxKind.ExportSpecifier:
//                return visitNode(cbNode, (<ImportOrExportSpecifier>node).propertyName) ||
//                    visitNode(cbNode, (<ImportOrExportSpecifier>node).name);
//            case SyntaxKind.ExportAssignment:
//                return visitNodes(cbNodes, node.decorators) ||
//                    visitNodes(cbNodes, node.modifiers) ||
//                    visitNode(cbNode, (<ExportAssignment>node).expression) ||
//                    visitNode(cbNode, (<ExportAssignment>node).type);
//            case SyntaxKind.TemplateExpression:
//                return visitNode(cbNode, (<TemplateExpression>node).head) || visitNodes(cbNodes, (<TemplateExpression>node).templateSpans);
//            case SyntaxKind.TemplateSpan:
//                return visitNode(cbNode, (<TemplateSpan>node).expression) || visitNode(cbNode, (<TemplateSpan>node).literal);
//            case SyntaxKind.ComputedPropertyName:
//                return visitNode(cbNode, (<ComputedPropertyName>node).expression);
//            case SyntaxKind.HeritageClause:
//                return visitNodes(cbNodes, (<HeritageClause>node).types);
//            case SyntaxKind.HeritageClauseElement:
//                return visitNode(cbNode, (<HeritageClauseElement>node).expression) ||
//                    visitNodes(cbNodes, (<HeritageClauseElement>node).typeArguments);
//            case SyntaxKind.ExternalModuleReference:
//                return visitNode(cbNode, (<ExternalModuleReference>node).expression);
//            case SyntaxKind.MissingDeclaration:
//                return visitNodes(cbNodes, node.decorators);
//        }
//    }
