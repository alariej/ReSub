"use strict";
/**
* incorrectStateAccess.ts
* Author: Sergei Dryganets
* Copyright: Microsoft 2017
*
* Custom tslint rule used to find cases where the code references
* this.state from UNSAFE_componentWillMount method.
*/
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rule = void 0;
var Lint = __importStar(require("tslint"));
var tsutils_1 = require("tsutils");
var typescript_1 = __importStar(require("typescript"));
var DEBUG = false;
var ERROR_MESSAGE = 'this.state is undefined in UNSAFE_componentWillMount callback.';
var Rule = /** @class */ (function (_super) {
    __extends(Rule, _super);
    function Rule() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Rule.prototype.apply = function (sourceFile) {
        return this.applyWithFunction(sourceFile, walk, this.ruleArguments);
    };
    Rule.metadata = {
        ruleName: 'incorrect-state-access',
        description: 'Bans state access for ReSub components',
        rationale: 'In ReSub Component this.state is undefined during UNSAFE_componentWillMount. We need to warn users about it.',
        optionsDescription: '',
        options: {},
        type: 'functionality',
        typescriptOnly: true,
    };
    return Rule;
}(Lint.Rules.AbstractRule));
exports.Rule = Rule;
var methods = {};
var method;
// Builds method call graph.
// For each method stores this.state statements
function analyzeMethodBody(node) {
    if ((0, tsutils_1.isCallExpression)(node)) {
        var expr = node.getText();
        if (expr.indexOf('this.') === 0) {
            var index = expr.indexOf('(');
            if (index) {
                var name_1 = expr.substring(5, index);
                method.calling.push(name_1);
                if (DEBUG) {
                    console.log('Method call', method.name + ' -> ' + name_1);
                }
            }
        }
        analyzeNodeChildren(node, 'CallExpression');
    }
    else if ((0, tsutils_1.isPropertyAccessExpression)(node)) {
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
    return typescript_1.default.forEachChild(ctx.sourceFile, function cb(node) {
        if ((0, typescript_1.isMethodDeclaration)(node)) {
            var methodName = node.name.getText();
            method = { name: methodName, calling: [], node: node, stateNodes: [] };
            methods[node.name.getText()] = method;
            if (node.body) {
                analyzeMethodBody(node.body);
            }
        }
        else if (node.kind === typescript_1.default.SyntaxKind.EndOfFileToken) {
            // End of file. Use collected information to analyze function call graph starting from willComponentMount
            var visitedMethods = {};
            var queue_1 = [];
            var methodsList = ctx.options.concat(['UNSAFE_componentWillMount']);
            methodsList.forEach(function (methodName) {
                var method = methods[methodName];
                if (method) {
                    queue_1.push(method);
                }
            });
            while (queue_1.length > 0) {
                var method_1 = queue_1.pop();
                if (!visitedMethods[method_1.name]) {
                    visitedMethods[method_1.name] = true;
                    method_1.stateNodes.forEach(function (node) {
                        ctx.addFailureAtNode(node, ERROR_MESSAGE);
                    });
                    method_1.calling.forEach(function (name) {
                        var called = methods[name];
                        if (called) {
                            queue_1.push(called);
                        }
                    });
                }
            }
            // clean up
            methods = {};
        }
        else {
            return typescript_1.default.forEachChild(node, cb);
        }
    });
}
