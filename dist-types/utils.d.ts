/**
 * utils.ts
 * Copyright: Microsoft 2019
 */
export declare type KeyOrKeys = string | number | (string | number)[];
export declare function noop(): void;
export declare function isFunction(object: any): object is Function;
export declare function isString(object: any): object is string;
export declare function isNumber(object: any): object is number;
export declare const normalizeKey: (key: string | number) => string;
export declare const normalizeKeys: (keyOrKeys: KeyOrKeys) => string[];
export declare const formCompoundKey: (...keys: (string | number)[]) => string;
export declare const assert: (cond: any, message?: string | undefined) => void;
export declare const remove: <T>(array: T[], predicate: (value: T) => boolean) => void;
export declare const uniq: <T>(array: T[]) => T[];
export declare const find: <T>(array: T[], predicate: (value: T, index: number, array: T[]) => boolean) => T | undefined;
