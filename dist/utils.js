"use strict";
/**
 * utils.ts
 * Copyright: Microsoft 2019
 */
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.find = exports.uniq = exports.remove = exports.assert = exports.formCompoundKey = exports.normalizeKeys = exports.normalizeKey = exports.isNumber = exports.isString = exports.isFunction = exports.noop = void 0;
var CompoundKeyJoinerString = '%&';
function noop() {
    // noop
}
exports.noop = noop;
function isFunction(object) {
    return typeof object === 'function';
}
exports.isFunction = isFunction;
function isString(object) {
    return typeof object === 'string';
}
exports.isString = isString;
function isNumber(object) {
    return typeof object === 'number';
}
exports.isNumber = isNumber;
var normalizeKey = function (key) { return (isNumber(key) ? key.toString() : key); };
exports.normalizeKey = normalizeKey;
var normalizeKeys = function (keyOrKeys) { return (Array.isArray(keyOrKeys) ? keyOrKeys.map(exports.normalizeKey) : [(0, exports.normalizeKey)(keyOrKeys)]); };
exports.normalizeKeys = normalizeKeys;
var formCompoundKey = function () {
    var keys = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        keys[_i] = arguments[_i];
    }
    return keys.join(CompoundKeyJoinerString);
};
exports.formCompoundKey = formCompoundKey;
var assert = function (cond, message) {
    if (!cond) {
        throw new Error("[resub] ".concat(message || 'Assertion Failed'));
    }
};
exports.assert = assert;
var remove = function (array, predicate) {
    for (var i = array.length - 1; i >= 0; i--) {
        if (predicate(array[i])) {
            array.splice(i, 1);
        }
    }
};
exports.remove = remove;
var uniq = function (array) {
    var e_1, _a;
    var set = new Set(array);
    if (isFunction(Array.from)) {
        return Array.from(set);
    }
    var uniq = [];
    try {
        for (var set_1 = __values(set), set_1_1 = set_1.next(); !set_1_1.done; set_1_1 = set_1.next()) {
            var value = set_1_1.value;
            uniq.push(value);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (set_1_1 && !set_1_1.done && (_a = set_1.return)) _a.call(set_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return uniq;
};
exports.uniq = uniq;
var find = function (array, predicate) {
    if (isFunction(array.find)) {
        return array.find(predicate);
    }
    var len = array.length;
    for (var i = 0; i < len; i++) {
        if (predicate(array[i], i, array)) {
            return array[i];
        }
    }
    return undefined;
};
exports.find = find;
