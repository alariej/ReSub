/**
* Options.ts
* Author: David de Regt
* Copyright: Microsoft 2015
*
* Basic options for ReSub.
*/
export interface IOptions {
    setTimeout: <T extends any[]>(handler: (params: T) => void, timeout?: number | undefined, ...params: T) => number;
    clearTimeout: (id?: number) => void;
    shouldComponentUpdateComparator: <T>(values: T, compareTo: T) => boolean;
    defaultThrottleMs: number;
    preventTryCatchInRender: boolean;
    development: boolean;
}
declare const OptionsVals: IOptions;
export default OptionsVals;
