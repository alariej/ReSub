"use strict";
/**
 * ReSub.ts
 * Author: David de Regt
 * Copyright: Microsoft 2016
 *
 * Shared basic types for ReSub.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Types = exports.StoreBase = exports.ComponentBase = exports.formCompoundKey = exports.Options = exports.setPerformanceMarkingEnabled = exports.CustomEqualityShouldComponentUpdate = exports.enableAutoSubscribeWrapper = exports.withResubAutoSubscriptions = exports.key = exports.autoSubscribe = exports.disableWarnings = exports.AutoSubscribeStore = exports.autoSubscribeWithKey = void 0;
var Types = __importStar(require("./Types"));
exports.Types = Types;
var AutoSubscriptions_1 = require("./AutoSubscriptions");
Object.defineProperty(exports, "autoSubscribeWithKey", { enumerable: true, get: function () { return AutoSubscriptions_1.autoSubscribeWithKey; } });
Object.defineProperty(exports, "AutoSubscribeStore", { enumerable: true, get: function () { return AutoSubscriptions_1.AutoSubscribeStore; } });
Object.defineProperty(exports, "disableWarnings", { enumerable: true, get: function () { return AutoSubscriptions_1.disableWarnings; } });
Object.defineProperty(exports, "autoSubscribe", { enumerable: true, get: function () { return AutoSubscriptions_1.autoSubscribe; } });
Object.defineProperty(exports, "key", { enumerable: true, get: function () { return AutoSubscriptions_1.key; } });
Object.defineProperty(exports, "withResubAutoSubscriptions", { enumerable: true, get: function () { return AutoSubscriptions_1.withResubAutoSubscriptions; } });
Object.defineProperty(exports, "enableAutoSubscribeWrapper", { enumerable: true, get: function () { return AutoSubscriptions_1.enableAutoSubscribeWrapper; } });
var ComponentDecorators_1 = require("./ComponentDecorators");
Object.defineProperty(exports, "CustomEqualityShouldComponentUpdate", { enumerable: true, get: function () { return ComponentDecorators_1.CustomEqualityShouldComponentUpdate; } });
var Instrumentation_1 = require("./Instrumentation");
Object.defineProperty(exports, "setPerformanceMarkingEnabled", { enumerable: true, get: function () { return Instrumentation_1.setPerformanceMarkingEnabled; } });
var Options_1 = require("./Options");
Object.defineProperty(exports, "Options", { enumerable: true, get: function () { return __importDefault(Options_1).default; } });
var utils_1 = require("./utils");
Object.defineProperty(exports, "formCompoundKey", { enumerable: true, get: function () { return utils_1.formCompoundKey; } });
var ComponentBase_1 = require("./ComponentBase");
Object.defineProperty(exports, "ComponentBase", { enumerable: true, get: function () { return ComponentBase_1.ComponentBase; } });
var StoreBase_1 = require("./StoreBase");
Object.defineProperty(exports, "StoreBase", { enumerable: true, get: function () { return StoreBase_1.StoreBase; } });
