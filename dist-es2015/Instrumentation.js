/**
 * Instrumentation.ts
 * Author: Lukas Weber
 * Copyright: Microsoft 2017
 */
import { noop } from './utils';
const BuildStateBeginMark = 'ComponentBase._buildState begin';
const BuildStateEndMark = 'ComponentBase._buildState end';
const CallbackBeginMark = 'StoreBase callbacks begin';
const CallbackEndMark = 'StoreBase callbacks end';
export class Instrumentation {
    constructor() {
        this._perf = Instrumentation._getPerformanceImpl();
    }
    static _getPerformanceImpl() {
        const g = typeof global !== 'undefined' ? global : undefined;
        const w = typeof window !== 'undefined' ? window : undefined;
        const { performance } = (g || w || { performance: undefined });
        if (performance) {
            return performance;
        }
        return {
            mark: noop,
            measure: noop,
        };
    }
    _measure(measureName, beginMark, endMark) {
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
    }
    beginBuildState() {
        this._perf.mark(BuildStateBeginMark);
    }
    endBuildState(target) {
        const measureName = `🌀 ${target.name || 'ComponentBase'} build state`;
        this._measure(measureName, BuildStateBeginMark, BuildStateEndMark);
    }
    beginInvokeStoreCallbacks() {
        this._perf.mark(CallbackBeginMark);
    }
    endInvokeStoreCallbacks(target, count) {
        const measureName = `📦 ${target.name || 'StoreBase'} callbacks(${count})`;
        this._measure(measureName, CallbackBeginMark, CallbackEndMark);
    }
}
// By default, disabled
export let impl;
export function setPerformanceMarkingEnabled(enabled) {
    impl = enabled ? new Instrumentation() : undefined;
}
