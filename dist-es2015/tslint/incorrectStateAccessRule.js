/**
* incorrectStateAccess.ts
* Author: Sergei Dryganets
* Copyright: Microsoft 2017
*
* Custom tslint rule used to find cases where the code references
* this.state from UNSAFE_componentWillMount method.
*/
import * as Lint from 'tslint';
import { isCallExpression, isPropertyAccessExpression } from 'tsutils';
import ts, { isMethodDeclaration } from 'typescript';
const DEBUG = false;
const ERROR_MESSAGE = 'this.state is undefined in UNSAFE_componentWillMount callback.';
export class Rule extends Lint.Rules.AbstractRule {
    apply(sourceFile) {
        return this.applyWithFunction(sourceFile, walk, this.ruleArguments);
    }
}
Rule.metadata = {
    ruleName: 'incorrect-state-access',
    description: 'Bans state access for ReSub components',
    rationale: 'In ReSub Component this.state is undefined during UNSAFE_componentWillMount. We need to warn users about it.',
    optionsDescription: '',
    options: {},
    type: 'functionality',
    typescriptOnly: true,
};
let methods = {};
let method;
// Builds method call graph.
// For each method stores this.state statements
function analyzeMethodBody(node) {
    if (isCallExpression(node)) {
        const expr = node.getText();
        if (expr.indexOf('this.') === 0) {
            const index = expr.indexOf('(');
            if (index) {
                const name = expr.substring(5, index);
                method.calling.push(name);
                if (DEBUG) {
                    console.log('Method call', method.name + ' -> ' + name);
                }
            }
        }
        analyzeNodeChildren(node, 'CallExpression');
    }
    else if (isPropertyAccessExpression(node)) {
        if (node.getText().lastIndexOf('this.state.') !== -1) {
            method.stateNodes.push(node);
            analyzeNodeChildren(node, 'ErrorProperyExpression', true);
        }
        else {
            analyzeNodeChildren(node, 'PropertyExpression', true);
        }
    }
    else {
        analyzeNodeChildren(node, 'Node');
    }
}
function analyzeNodeChildren(node, context, skip) {
    if (DEBUG) {
        console.log(context, node.kind, node.getText());
    }
    if (!skip) {
        node.forEachChild(analyzeMethodBody);
    }
}
function walk(ctx) {
    return ts.forEachChild(ctx.sourceFile, function cb(node) {
        if (isMethodDeclaration(node)) {
            const methodName = node.name.getText();
            method = { name: methodName, calling: [], node, stateNodes: [] };
            methods[node.name.getText()] = method;
            if (node.body) {
                analyzeMethodBody(node.body);
            }
        }
        else if (node.kind === ts.SyntaxKind.EndOfFileToken) {
            // End of file. Use collected information to analyze function call graph starting from willComponentMount
            const visitedMethods = {};
            const queue = [];
            const methodsList = ctx.options.concat(['UNSAFE_componentWillMount']);
            methodsList.forEach((methodName) => {
                const method = methods[methodName];
                if (method) {
                    queue.push(method);
                }
            });
            while (queue.length > 0) {
                const method = queue.pop();
                if (!visitedMethods[method.name]) {
                    visitedMethods[method.name] = true;
                    method.stateNodes.forEach((node) => {
                        ctx.addFailureAtNode(node, ERROR_MESSAGE);
                    });
                    method.calling.forEach((name) => {
                        const called = methods[name];
                        if (called) {
                            queue.push(called);
                        }
                    });
                }
            }
            // clean up
            methods = {};
        }
        else {
            return ts.forEachChild(node, cb);
        }
    });
}
