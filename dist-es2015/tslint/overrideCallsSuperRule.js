/**
* OverrideCallsSuperRule.ts
* Author: Mark Davis
* Copyright: Microsoft 2016
*
* Custom tslint rule used to enforce certain overrided method calls their `super` version.
*/
import ts from 'typescript';
import { Rules, RuleWalker } from 'tslint';
const MISSING_SUPER_CALL = 'Method override must call super.%';
const MISSING_TOP_LEVEL_SUPER_CALL = 'Method override must call super.% in the top-level statements of the method body';
const SUPER_REGEXP = /\bsuper\.([a-zA-Z0-9_]+)\(/g;
export class Rule extends Rules.AbstractRule {
    apply(sourceFile) {
        const options = this.getOptions();
        const overrideCallsSuperWalker = new OverrideCallsSuperWalker(sourceFile, options);
        const methodNamesToCheck = options.ruleArguments;
        methodNamesToCheck.forEach(f => overrideCallsSuperWalker.addOverrideMethodToCheck(f));
        return this.applyWithWalker(overrideCallsSuperWalker);
    }
}
class OverrideCallsSuperWalker extends RuleWalker {
    constructor() {
        super(...arguments);
        this._methodNamesToCheck = [];
    }
    addOverrideMethodToCheck(methodName) {
        this._methodNamesToCheck.push(methodName);
    }
    visitMethodDeclaration(node) {
        const methodName = node.name.getText();
        if (this._methodNamesToCheck.includes(methodName)) {
            this._checkOverrideCallsSuper(node, methodName);
        }
        // call the base version of this visitor to actually parse this node
        super.visitMethodDeclaration(node);
    }
    _checkOverrideCallsSuper(node, methodName) {
        // Must have a call to super (for the same method name) in the top-level list of statements.
        let hasSuperCall = false;
        if (node.body) {
            hasSuperCall = node.body.statements.some(statement => {
                if (statement.kind !== ts.SyntaxKind.ExpressionStatement) {
                    return false;
                }
                const expressionStatement = statement;
                if (expressionStatement.expression.kind !== ts.SyntaxKind.CallExpression) {
                    return false;
                }
                const callExpression = expressionStatement.expression;
                if (callExpression.expression.kind !== ts.SyntaxKind.PropertyAccessExpression) {
                    return false;
                }
                const propertyAccessExpression = callExpression.expression;
                if (propertyAccessExpression.expression.kind !== ts.SyntaxKind.SuperKeyword) {
                    return false;
                }
                return this._hasSuperCallForSameMethodName(callExpression, methodName);
            });
        }
        if (!hasSuperCall) {
            // If it had a super call for the same method but not at the top level, then give a more specific warning.
            const failureTemplate = this._hasSuperCallForSameMethodName(node, methodName)
                ? MISSING_TOP_LEVEL_SUPER_CALL
                : MISSING_SUPER_CALL;
            const failureString = failureTemplate.replace(/%/g, methodName);
            // Create a failure at the current position.
            this.addFailure(this.createFailure(node.getStart(), node.getWidth(), failureString));
        }
    }
    _hasSuperCallForSameMethodName(node, methodName) {
        const text = node.getText();
        let match;
        while ((match = SUPER_REGEXP.exec(text))) {
            if (match[1] === methodName) {
                // This method is fine, so we can bail early.
                // Note: reseting the regex index so it is in a fresh state for its next use.
                SUPER_REGEXP.lastIndex = 0;
                return true;
            }
        }
        return false;
    }
}
