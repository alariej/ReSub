"use strict";
/**
 * ComponentDecorators.ts
 * Copyright: Microsoft 2019
 *
 * Exposes helper decorator functions for use with ReSub Components
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomEqualityShouldComponentUpdate = void 0;
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function CustomEqualityShouldComponentUpdate(comparator) {
    return function (constructor) {
        constructor.prototype.shouldComponentUpdate = comparator;
        return constructor;
    };
}
exports.CustomEqualityShouldComponentUpdate = CustomEqualityShouldComponentUpdate;
