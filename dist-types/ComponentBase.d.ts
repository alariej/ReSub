/**
* ComponentBase.ts
* Author: David de Regt
* Copyright: Microsoft 2016
*
* Base class for React components, adding in support for automatic store registration and unregistration.
*/
import * as React from 'react';
export declare abstract class ComponentBase<P = {}, S = {}> extends React.Component<P, S> {
    private _handledAutoSubscriptions;
    private _isMounted;
    constructor(props: P);
    static getDerivedStateFromProps: React.GetDerivedStateFromProps<unknown, unknown>;
    private _handleUpdate;
    componentWillUnmount(): void;
    shouldComponentUpdate(nextProps: Readonly<P>, nextState: Readonly<S>, nextContext: any): boolean;
    isComponentMounted(): boolean;
    private _shouldRemoveAndCleanupAutoSubscription;
    private static _onAutoSubscriptionChangedUnbound;
    private _onAutoSubscriptionChanged;
    private _handleAutoSubscribe;
    private _findMatchingAutoSubscription;
    private static _autoSubscribeHandler;
    private _buildStateWithAutoSubscriptions;
    protected _buildState(props: P, initialBuild: boolean, incomingState: Readonly<S> | undefined): Partial<S> | undefined;
    protected _buildInitialState(): Readonly<S>;
    componentDidMount(): void;
    componentDidUpdate(prevProps: Readonly<P>, prevState: S, prevContext: any): void;
    protected _componentDidRender(): void;
}
export default ComponentBase;
