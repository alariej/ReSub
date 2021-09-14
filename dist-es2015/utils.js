/**
 * utils.ts
 * Copyright: Microsoft 2019
 */
const CompoundKeyJoinerString = '%&';
export function noop() {
    // noop
}
export function isFunction(object) {
    return typeof object === 'function';
}
export function isString(object) {
    return typeof object === 'string';
}
export function isNumber(object) {
    return typeof object === 'number';
}
export const normalizeKey = (key) => (isNumber(key) ? key.toString() : key);
export const normalizeKeys = (keyOrKeys) => (Array.isArray(keyOrKeys) ? keyOrKeys.map(normalizeKey) : [normalizeKey(keyOrKeys)]);
export const formCompoundKey = (...keys) => keys.join(CompoundKeyJoinerString);
export const assert = (cond, message) => {
    if (!cond) {
        throw new Error(`[resub] ${message || 'Assertion Failed'}`);
    }
};
export const remove = (array, predicate) => {
    for (let i = array.length - 1; i >= 0; i--) {
        if (predicate(array[i])) {
            array.splice(i, 1);
        }
    }
};
export const uniq = (array) => {
    const set = new Set(array);
    if (isFunction(Array.from)) {
        return Array.from(set);
    }
    const uniq = [];
    for (const value of set) {
        uniq.push(value);
    }
    return uniq;
};
export const find = (array, predicate) => {
    if (isFunction(array.find)) {
        return array.find(predicate);
    }
    const len = array.length;
    for (let i = 0; i < len; i++) {
        if (predicate(array[i], i, array)) {
            return array[i];
        }
    }
    return undefined;
};
