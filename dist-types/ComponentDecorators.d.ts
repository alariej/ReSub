/**
 * ComponentDecorators.ts
 * Copyright: Microsoft 2019
 *
 * Exposes helper decorator functions for use with ReSub Components
 */
import ComponentBase from './ComponentBase';
export declare function CustomEqualityShouldComponentUpdate<P, S = {}>(comparator: (this: ComponentBase<P, S>, nextProps: Readonly<P>, nextState: Readonly<S>, nextContext: any) => boolean): <T extends new (props: any) => ComponentBase<P, S>>(constructor: T) => T;
