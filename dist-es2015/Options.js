/**
* Options.ts
* Author: David de Regt
* Copyright: Microsoft 2015
*
* Basic options for ReSub.
*/
const OptionsVals = {
    setTimeout: setTimeout.bind(null),
    clearTimeout: clearTimeout.bind(null),
    shouldComponentUpdateComparator: () => false,
    defaultThrottleMs: 0,
    preventTryCatchInRender: false,
    development: typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production',
};
export default OptionsVals;
