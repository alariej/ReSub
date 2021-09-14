"use strict";
/**
 * Instrumentation.ts
 * Author: Lukas Weber
 * Copyright: Microsoft 2017
 */
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var BuildStateBeginMark = 'ComponentBase._buildState begin';
var BuildStateEndMark = 'ComponentBase._buildState end';
var CallbackBeginMark = 'StoreBase callbacks begin';
var CallbackEndMark = 'StoreBase callbacks end';
var Instrumentation = /** @class */ (function () {
    function Instrumentation() {
        this._perf = Instrumentation._getPerformanceImpl();
    }
    Instrumentation._getPerformanceImpl = function () {
        var g = typeof global !== 'undefined' ? global : undefined;
        var w = typeof window !== 'undefined' ? window : undefined;
        var performance = (g || w || { performance: undefined }).performance;
        if (performance && performance.mark && performance.measure) {
            return performance;
        }
        return {
            mark: utils_1.noop,
            measure: utils_1.noop,
        };
    };
    Instrumentation.prototype._measure = function (measureName, beginMark, endMark) {
        this._perf.mark(endMark);
        try {
            this._perf.measure(measureName, beginMark, endMark);
        }
        catch (e) {
            // We might be missing some marks if something would go south
            // at call site and in next attempt measure() will throw
            // an exception which may be misleading and could cover real
            // source of problems so it's better to swallow it as this
            // tool should be as much transparent as possible.
        }
    };
    Instrumentation.prototype.beginBuildState = function () {
        this._perf.mark(BuildStateBeginMark);
    };
    Instrumentation.prototype.endBuildState = function (target) {
        var measureName = "\uD83C\uDF00 " + (target.name || 'ComponentBase') + " build state";
        this._measure(measureName, BuildStateBeginMark, BuildStateEndMark);
    };
    Instrumentation.prototype.beginInvokeStoreCallbacks = function () {
        this._perf.mark(CallbackBeginMark);
    };
    Instrumentation.prototype.endInvokeStoreCallbacks = function (target, count) {
        var measureName = "\uD83D\uDCE6 " + (target.name || 'StoreBase') + " callbacks(" + count + ")";
        this._measure(measureName, CallbackBeginMark, CallbackEndMark);
    };
    return Instrumentation;
}());
exports.Instrumentation = Instrumentation;
function setPerformanceMarkingEnabled(enabled) {
    exports.impl = enabled ? new Instrumentation() : undefined;
}
exports.setPerformanceMarkingEnabled = setPerformanceMarkingEnabled;
