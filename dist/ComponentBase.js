"use strict";
/**
* ComponentBase.ts
* Author: David de Regt
* Copyright: Microsoft 2016
*
* Base class for React components, adding in support for automatic store registration and unregistration.
*/
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentBase = void 0;
var React = __importStar(require("react"));
var Options_1 = __importDefault(require("./Options"));
var Instrumentation = __importStar(require("./Instrumentation"));
var AutoSubscriptions_1 = require("./AutoSubscriptions");
var utils_1 = require("./utils");
var StoreBase_1 = require("./StoreBase");
// ComponentBase actually has InternalState, but we don't want this exposed, so don't indicate that on the component definition
var ComponentBase = /** @class */ (function (_super) {
    __extends(ComponentBase, _super);
    function ComponentBase(props) {
        var _this = _super.call(this, props) || this;
        // ComponentBase is provided a method to wrap autosubscriptions via _buildState in a component
        _this._handledAutoSubscriptions = [];
        _this._isMounted = false;
        _this._onAutoSubscriptionChanged = function () {
            ComponentBase._onAutoSubscriptionChangedUnbound(_this);
        };
        var derivedClassRender = _this.render || utils_1.noop;
        var render = derivedClassRender;
        if (!Options_1.default.preventTryCatchInRender) {
            render = function () {
                // Handle exceptions because otherwise React would break and the app would become unusable until refresh.
                // Note: React error boundaries will make this redundant.
                try {
                    return derivedClassRender.call(_this);
                }
                catch (e) {
                    // Annoy devs so this gets fixed.
                    if (Options_1.default.development) {
                        // tslint:disable-next-line
                        throw e;
                    }
                    // Try to move on.
                    return null;
                }
            };
        }
        // No one should use Store getters in render: do that in _buildState instead.
        _this.render = (0, AutoSubscriptions_1.forbidAutoSubscribeWrapper)(render, _this);
        var instance = _this;
        /*
         * We can't call _buildInitialState here, because the properties of the subclass are initialized **after** the base class
         * constructor. https://github.com/microsoft/TypeScript/issues/1617#issuecomment-69215655
         * Therefore we need to call it after the constructor.
         * Since getDerivedStateFromProps is called after the constructor, we can ensure, that the state is properly initialized
         * there.
         * But we need to put the instance into the state, so that getDerivedStateFromProps works.
         * Hence the rather hacky type conversion.
         */
        // eslint-disable-next-line
        _this.state = {
            _resubGetInstance: function () { return instance; },
            _resubDirty: false,
        };
        return _this;
    }
    ComponentBase.prototype._handleUpdate = function (nextProps, incomingState) {
        if (!Options_1.default.shouldComponentUpdateComparator(this.props, nextProps)) {
            var newState = this._buildStateWithAutoSubscriptions(nextProps, incomingState, false);
            if (newState && Object.keys(newState).length) {
                return newState;
            }
        }
        return null;
    };
    // Subclasses may override, but _MUST_ call super.
    ComponentBase.prototype.componentWillUnmount = function () {
        var e_1, _a;
        try {
            // Remove and cleanup all suscriptions
            for (var _b = __values(this._handledAutoSubscriptions), _c = _b.next(); !_c.done; _c = _b.next()) {
                var subscription = _c.value;
                subscription.used = false;
                subscription.store.removeAutoSubscription(subscription);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        this._handledAutoSubscriptions = [];
        this._isMounted = false;
    };
    ComponentBase.prototype.shouldComponentUpdate = function (nextProps, nextState, nextContext) {
        return !Options_1.default.shouldComponentUpdateComparator(this.state, nextState) ||
            !Options_1.default.shouldComponentUpdateComparator(this.props, nextProps) ||
            !Options_1.default.shouldComponentUpdateComparator(this.context, nextContext);
    };
    ComponentBase.prototype.isComponentMounted = function () {
        return this._isMounted;
    };
    ComponentBase.prototype._shouldRemoveAndCleanupAutoSubscription = function (subscription) {
        return !subscription.used;
    };
    // Performance optimization - don't put this in _onAutoSubscriptionChanged because every component will have it's own
    // instance of the function instead of hanging off the prototype. Bound functions also lack some runtime optimizations
    ComponentBase._onAutoSubscriptionChangedUnbound = function (that) {
        if (!that.isComponentMounted()) {
            return;
        }
        // eslint-disable-next-line
        that.setState({ _resubDirty: true });
    };
    ComponentBase.prototype._handleAutoSubscribe = function (store, key) {
        // Check for an existing auto-subscription.
        var autoSubscription = this._findMatchingAutoSubscription(store, key);
        if (autoSubscription) {
            // Set auto-subscription as used
            autoSubscription.used = true;
            return;
        }
        // None found: auto-subscribe!
        var subscription = {
            store: store,
            // Note: an undefined specificKeyValue will use Key_All by default.
            key: key,
            callback: this._onAutoSubscriptionChanged,
            used: true,
        };
        this._handledAutoSubscriptions.push(subscription);
        subscription.store.trackAutoSubscription(subscription);
    };
    // Search already handled auto-subscription
    ComponentBase.prototype._findMatchingAutoSubscription = function (store, key) {
        return (0, utils_1.find)(this._handledAutoSubscriptions, function (subscription) { return ((subscription.store.storeId === store.storeId) &&
            (subscription.key === key || subscription.key === StoreBase_1.StoreBase.Key_All)); });
    };
    ComponentBase.prototype._buildStateWithAutoSubscriptions = function (props, incomingState, initialBuild) {
        var e_2, _a;
        var _this = this;
        try {
            for (var _b = __values(this._handledAutoSubscriptions), _c = _b.next(); !_c.done; _c = _b.next()) {
                var sub = _c.value;
                sub.used = false;
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
        if (Instrumentation.impl) {
            Instrumentation.impl.beginBuildState();
        }
        var state = this._buildState(props, initialBuild, incomingState);
        if (Instrumentation.impl) {
            Instrumentation.impl.endBuildState(this.constructor);
        }
        (0, utils_1.remove)(this._handledAutoSubscriptions, function (subscription) {
            if (_this._shouldRemoveAndCleanupAutoSubscription(subscription)) {
                subscription.store.removeAutoSubscription(subscription);
                return true;
            }
            return false;
        });
        return state;
    };
    // All but the simplest of components should implement this virtual function.  This function is called in 3 places
    // by the framework:
    // 1. In the component constructor, it's called with the initial props and initialBuild = true.  This is where you should set all
    //    initial state for your component.  In many cases this case needs no special casing whatsoever because the component always
    //    rebuilds all of its state from whatever the props are, whether it's an initial build or a new props received event.
    // 2. In the React lifecycle, during a UNSAFE_componentWillReceiveProps, if the props change, this is called so that the component
    //    can rebuild state from the new props.
    // 3. If the component subscribes to any stores via the ComponentBase subscription system, if a specific callback function is not
    //    specified, then this function is called whenever the subscription is triggered.  Basically, this should be used if there are
    //    no performance considerations with simply rebuilding the whole component whenever a subscription is triggered, which is
    //    very often the case.
    //
    // In the majority of cases, this turns into a simple function that doesn't care about initialBuild, and simply
    // rebuilds the whole state of the component whenever called.  This should usually only be made more specific if
    // there are performance considerations with over-rebuilding.
    ComponentBase.prototype._buildState = function (props, initialBuild, incomingState) {
        return undefined;
    };
    // The initial state is unavailable in UNSAFE_componentWillMount. Override this method to get access to it.
    // Subclasses may override, but _MUST_ call super.
    ComponentBase.prototype._buildInitialState = function () {
        // Initialize state, here we omit the internal state to the user
        var initialState = this._buildStateWithAutoSubscriptions(this.props, undefined, true) || {};
        return initialState;
    };
    // Wrap both didMount and didUpdate into componentDidRender
    ComponentBase.prototype.componentDidMount = function () {
        this._isMounted = true;
        this._componentDidRender();
    };
    ComponentBase.prototype.componentDidUpdate = function (prevProps, prevState, prevContext) {
        this._componentDidRender();
    };
    ComponentBase.prototype._componentDidRender = function () {
        // Virtual helper function to override as needed
    };
    // Subclasses may redeclare, but must call ComponentBase.getDerivedStateFromProps
    ComponentBase.getDerivedStateFromProps = function (nextProps, prevState) {
        var internalState = prevState;
        if (!internalState._resubGetInstance) {
            throw new Error('Resub internal state missing - ensure you aren\'t setting state directly in component construtor');
        }
        var newState;
        var instance = internalState._resubGetInstance();
        if (!instance._isMounted) {
            newState = instance._buildInitialState();
        }
        else {
            newState = instance._handleUpdate(nextProps, internalState) || {};
        }
        // reset dirty bit
        newState._resubDirty = false;
        return newState;
    };
    // Handler for enableAutoSubscribe that does the actual auto-subscription work.
    ComponentBase._autoSubscribeHandler = {
        // Callback to handle the 'auto-subscribe'.
        handle: function (self, store, key) {
            self._handleAutoSubscribe(store, key);
        },
    };
    __decorate([
        (0, AutoSubscriptions_1.enableAutoSubscribe)(ComponentBase._autoSubscribeHandler)
    ], ComponentBase.prototype, "_buildStateWithAutoSubscriptions", null);
    return ComponentBase;
}(React.Component));
exports.ComponentBase = ComponentBase;
exports.default = ComponentBase;
