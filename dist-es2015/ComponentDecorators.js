/**
 * ComponentDecorators.ts
 * Copyright: Microsoft 2019
 *
 * Exposes helper decorator functions for use with ReSub Components
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function CustomEqualityShouldComponentUpdate(comparator) {
    return function (constructor) {
        constructor.prototype.shouldComponentUpdate = comparator;
        return constructor;
    };
}
