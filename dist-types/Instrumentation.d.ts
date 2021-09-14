/**
 * Instrumentation.ts
 * Author: Lukas Weber
 * Copyright: Microsoft 2017
 */
export interface Performance {
    mark: (name: string) => void;
    measure: (name: string, startMark: string, endMark: string) => void;
}
export declare class Instrumentation {
    private _perf;
    private static _getPerformanceImpl;
    private _measure;
    beginBuildState(): void;
    endBuildState(target: any): void;
    beginInvokeStoreCallbacks(): void;
    endInvokeStoreCallbacks(target: any, count: number): void;
}
export declare let impl: Instrumentation | undefined;
export declare function setPerformanceMarkingEnabled(enabled: boolean): void;
