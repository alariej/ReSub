"use strict";
/**
* StoreBase.ts
* Author: David de Regt
* Copyright: Microsoft 2015
*
* StoreBase acts as the base class to all stores.  Allows for pub/sub and event triggering at a variety of levels of the store.
* It also supports key triggering deferral and aggregation.  Stores can mark that they're okay getting delayed triggers for X ms,
* during which period the StoreBase gathers all incoming triggers and dedupes them, and releases them all at the same time at
* the end of the delay period.  You can also globally push a trigger-block onto a stack and if the stack is nonzero, then
* triggers will be queued for ALL stores until the block is popped, at which point all queued triggers will fire simultaneously.
* Stores can mark themselves as opt-out of the trigger-block logic for critical stores that must flow under all conditions.
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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var Instrumentation = __importStar(require("./Instrumentation"));
var Options_1 = __importDefault(require("./Options"));
var utils_1 = require("./utils");
var StoreBase = /** @class */ (function () {
    function StoreBase(_throttleMs, _bypassTriggerBlocks) {
        var _this = this;
        if (_bypassTriggerBlocks === void 0) { _bypassTriggerBlocks = false; }
        this._throttleMs = _throttleMs;
        this._bypassTriggerBlocks = _bypassTriggerBlocks;
        this._subscriptions = new Map();
        this._autoSubscriptions = new Map();
        this._subTokenNum = 1;
        this._subsByNum = new Map();
        this.storeId = "store" + StoreBase._storeIdCounter++;
        this._handleThrottledCallbacks = function () {
            _this._throttleData = undefined;
            StoreBase._resolveCallbacks();
        };
    }
    ;
    StoreBase.pushTriggerBlock = function () {
        this._triggerBlockCount++;
    };
    StoreBase.popTriggerBlock = function () {
        this._triggerBlockCount--;
        utils_1.assert(this._triggerBlockCount >= 0, 'Over-popped trigger blocks!');
        if (this._triggerBlockCount === 0) {
            StoreBase._resolveCallbacks();
        }
    };
    StoreBase.setThrottleStatus = function (enabled) {
        this._bypassThrottle = !enabled;
        StoreBase._resolveCallbacks();
    };
    // If you trigger a specific set of keys, then it will only trigger that specific set of callbacks (and subscriptions marked
    // as "All" keyed).  If the key is all, it will trigger all callbacks.
    StoreBase.prototype.trigger = function (keyOrKeys) {
        var e_1, _a, e_2, _b, e_3, _c, e_4, _d, e_5, _e, e_6, _f, e_7, _g, e_8, _h, e_9, _j;
        var throttleMs = this._throttleMs !== undefined
            ? this._throttleMs
            : Options_1.default.defaultThrottleMs;
        // If we're throttling, save execution time
        var throttledUntil;
        if (throttleMs) {
            if (!this._throttleData) {
                // Needs to accumulate and trigger later -- start a timer if we don't have one running already
                // If there are no callbacks, don't bother setting up the timer
                this._throttleData = {
                    timerId: Options_1.default.setTimeout(this._handleThrottledCallbacks, this._throttleMs),
                    callbackTime: Date.now() + throttleMs,
                };
            }
            throttledUntil = this._throttleData.callbackTime;
        }
        var bypassBlock = this._bypassTriggerBlocks;
        // trigger(0) is valid, ensure that we catch this case
        if (!keyOrKeys && !utils_1.isNumber(keyOrKeys)) {
            try {
                // Inspecific key, so generic callback call
                for (var _k = __values(this._subscriptions.values()), _l = _k.next(); !_l.done; _l = _k.next()) {
                    var subs = _l.value;
                    try {
                        for (var subs_1 = (e_2 = void 0, __values(subs)), subs_1_1 = subs_1.next(); !subs_1_1.done; subs_1_1 = subs_1.next()) {
                            var sub = subs_1_1.value;
                            this._setupAllKeySubscription(sub, throttledUntil, bypassBlock);
                        }
                    }
                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                    finally {
                        try {
                            if (subs_1_1 && !subs_1_1.done && (_b = subs_1.return)) _b.call(subs_1);
                        }
                        finally { if (e_2) throw e_2.error; }
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_l && !_l.done && (_a = _k.return)) _a.call(_k);
                }
                finally { if (e_1) throw e_1.error; }
            }
            try {
                for (var _m = __values(this._autoSubscriptions.values()), _o = _m.next(); !_o.done; _o = _m.next()) {
                    var subs = _o.value;
                    try {
                        for (var subs_2 = (e_4 = void 0, __values(subs)), subs_2_1 = subs_2.next(); !subs_2_1.done; subs_2_1 = subs_2.next()) {
                            var sub = subs_2_1.value;
                            this._setupAllKeySubscription(sub.callback, throttledUntil, bypassBlock);
                        }
                    }
                    catch (e_4_1) { e_4 = { error: e_4_1 }; }
                    finally {
                        try {
                            if (subs_2_1 && !subs_2_1.done && (_d = subs_2.return)) _d.call(subs_2);
                        }
                        finally { if (e_4) throw e_4.error; }
                    }
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_o && !_o.done && (_c = _m.return)) _c.call(_m);
                }
                finally { if (e_3) throw e_3.error; }
            }
        }
        else {
            var keys = utils_1.normalizeKeys(keyOrKeys);
            try {
                // Key list, so go through each key and queue up the callback
                for (var keys_1 = __values(keys), keys_1_1 = keys_1.next(); !keys_1_1.done; keys_1_1 = keys_1.next()) {
                    var key = keys_1_1.value;
                    try {
                        for (var _p = (e_6 = void 0, __values((this._subscriptions.get(key) || []))), _q = _p.next(); !_q.done; _q = _p.next()) {
                            var callback = _q.value;
                            this._setupSpecificKeySubscription([key], callback, throttledUntil, bypassBlock);
                        }
                    }
                    catch (e_6_1) { e_6 = { error: e_6_1 }; }
                    finally {
                        try {
                            if (_q && !_q.done && (_f = _p.return)) _f.call(_p);
                        }
                        finally { if (e_6) throw e_6.error; }
                    }
                    try {
                        for (var _r = (e_7 = void 0, __values((this._autoSubscriptions.get(key) || []))), _s = _r.next(); !_s.done; _s = _r.next()) {
                            var sub = _s.value;
                            this._setupSpecificKeySubscription([key], sub.callback, throttledUntil, bypassBlock);
                        }
                    }
                    catch (e_7_1) { e_7 = { error: e_7_1 }; }
                    finally {
                        try {
                            if (_s && !_s.done && (_g = _r.return)) _g.call(_r);
                        }
                        finally { if (e_7) throw e_7.error; }
                    }
                }
            }
            catch (e_5_1) { e_5 = { error: e_5_1 }; }
            finally {
                try {
                    if (keys_1_1 && !keys_1_1.done && (_e = keys_1.return)) _e.call(keys_1);
                }
                finally { if (e_5) throw e_5.error; }
            }
            try {
                // Go through each of the all-key subscriptions and add the full key list to their gathered list
                for (var _t = __values((this._subscriptions.get(StoreBase.Key_All) || [])), _u = _t.next(); !_u.done; _u = _t.next()) {
                    var callback = _u.value;
                    this._setupSpecificKeySubscription(keys, callback, throttledUntil, bypassBlock);
                }
            }
            catch (e_8_1) { e_8 = { error: e_8_1 }; }
            finally {
                try {
                    if (_u && !_u.done && (_h = _t.return)) _h.call(_t);
                }
                finally { if (e_8) throw e_8.error; }
            }
            try {
                for (var _v = __values((this._autoSubscriptions.get(StoreBase.Key_All) || [])), _w = _v.next(); !_w.done; _w = _v.next()) {
                    var sub = _w.value;
                    this._setupSpecificKeySubscription(keys, sub.callback, throttledUntil, bypassBlock);
                }
            }
            catch (e_9_1) { e_9 = { error: e_9_1 }; }
            finally {
                try {
                    if (_w && !_w.done && (_j = _v.return)) _j.call(_v);
                }
                finally { if (e_9) throw e_9.error; }
            }
        }
        if (!throttledUntil || bypassBlock) {
            StoreBase._resolveCallbacks();
        }
    };
    StoreBase._updateExistingMeta = function (meta, throttledUntil, bypassBlock) {
        if (!meta) {
            return;
        }
        // Update throttling value to me min of exiting and new value
        if (throttledUntil && meta.throttledUntil) {
            meta.throttledUntil = Math.min(meta.throttledUntil, throttledUntil);
        }
        if (!throttledUntil) {
            meta.throttledUntil = undefined;
        }
        if (bypassBlock) {
            meta.bypassBlock = true;
        }
    };
    StoreBase.prototype._setupAllKeySubscription = function (callback, throttledUntil, bypassBlock) {
        var existingMeta = StoreBase._pendingCallbacks.get(callback);
        var newMeta = { keys: null, throttledUntil: throttledUntil, bypassBlock: bypassBlock };
        // Clear the key list to null for the callback but respect previous throttle/bypass values
        if (existingMeta && throttledUntil && existingMeta.throttledUntil) {
            newMeta.throttledUntil = Math.min(throttledUntil, existingMeta.throttledUntil);
        }
        if (existingMeta && existingMeta.bypassBlock) {
            newMeta.bypassBlock = true;
        }
        StoreBase._pendingCallbacks.set(callback, newMeta);
    };
    StoreBase.prototype._setupSpecificKeySubscription = function (keys, callback, throttledUntil, bypassBlock) {
        var existingMeta = StoreBase._pendingCallbacks.get(callback);
        StoreBase._updateExistingMeta(existingMeta, throttledUntil, bypassBlock);
        if (existingMeta === undefined) {
            // We need to clone keys in order to prevent accidental by-ref mutations
            StoreBase._pendingCallbacks.set(callback, { keys: __spread(keys), throttledUntil: throttledUntil, bypassBlock: bypassBlock });
        }
        else if (existingMeta.keys === null) {
            // Do nothing since it's already an all-key-trigger
        }
        else {
            // Add them all to the end of the list
            // Refrain from using spead operater here, this can result in a stack overflow if a large number of keys are triggered
            var keyCount = keys.length;
            for (var i = 0; i < keyCount; i++) {
                existingMeta.keys.push(keys[i]);
            }
        }
    };
    StoreBase._resolveCallbacks = function () {
        var e_10, _a, e_11, _b;
        // Prevent a store from triggering while it's already in a trigger state
        if (StoreBase._isTriggering) {
            StoreBase._triggerPending = true;
            return;
        }
        StoreBase._isTriggering = true;
        StoreBase._triggerPending = false;
        if (Instrumentation.impl) {
            Instrumentation.impl.beginInvokeStoreCallbacks();
        }
        var callbacksCount = 0;
        var currentTime = Date.now();
        // Capture the callbacks we need to call
        var callbacks = [];
        try {
            for (var _c = __values(this._pendingCallbacks), _d = _c.next(); !_d.done; _d = _c.next()) {
                var _e = __read(_d.value, 2), callback = _e[0], meta = _e[1];
                // Block check
                if (StoreBase._triggerBlockCount > 0 && !meta.bypassBlock) {
                    continue;
                }
                // Throttle check
                if (meta.throttledUntil && meta.throttledUntil > currentTime && !StoreBase._bypassThrottle) {
                    continue;
                }
                // Do a quick dedupe on keys
                var uniquedKeys = meta.keys ? utils_1.uniq(meta.keys) : meta.keys;
                // Convert null key (meaning "all") to undefined for the callback.
                callbacks.push([callback, uniquedKeys || undefined]);
                this._pendingCallbacks.delete(callback);
            }
        }
        catch (e_10_1) { e_10 = { error: e_10_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_10) throw e_10.error; }
        }
        try {
            for (var callbacks_1 = __values(callbacks), callbacks_1_1 = callbacks_1.next(); !callbacks_1_1.done; callbacks_1_1 = callbacks_1.next()) {
                var _f = __read(callbacks_1_1.value, 2), callback = _f[0], keys = _f[1];
                callbacksCount++;
                callback(keys);
            }
        }
        catch (e_11_1) { e_11 = { error: e_11_1 }; }
        finally {
            try {
                if (callbacks_1_1 && !callbacks_1_1.done && (_b = callbacks_1.return)) _b.call(callbacks_1);
            }
            finally { if (e_11) throw e_11.error; }
        }
        if (Instrumentation.impl) {
            Instrumentation.impl.endInvokeStoreCallbacks(this.constructor, callbacksCount);
        }
        StoreBase._isTriggering = false;
        if (this._triggerPending) {
            StoreBase._resolveCallbacks();
        }
    };
    // Subscribe to triggered events from this store.  You can leave the default key, in which case you will be
    // notified of any triggered events, or you can use a key to filter it down to specific event keys you want.
    // Returns a token you can pass back to unsubscribe.
    StoreBase.prototype.subscribe = function (callback, rawKey) {
        if (rawKey === void 0) { rawKey = StoreBase.Key_All; }
        var key = utils_1.normalizeKey(rawKey);
        // Adding extra type-checks since the key is often the result of following a string path, which is not type-safe.
        utils_1.assert(key && utils_1.isString(key), "Trying to subscribe to invalid key: \"" + key + "\"");
        var callbacks = this._subscriptions.get(key);
        if (!callbacks) {
            this._subscriptions.set(key, [callback]);
            // First manual subscription for this key.  See if we also aren't already tracking an auto subscription for it.
            if (!this._autoSubscriptions.has(key)) {
                this._startedTrackingSub(key === StoreBase.Key_All ? undefined : key);
            }
        }
        else {
            callbacks.push(callback);
        }
        var token = this._subTokenNum++;
        this._subsByNum.set(token, { key: key, callback: callback });
        return token;
    };
    // Unsubscribe from a previous subscription.  Pass in the token the subscribe function handed you.
    StoreBase.prototype.unsubscribe = function (subToken) {
        var sub = this._subsByNum.get(subToken);
        if (!sub) {
            utils_1.assert(sub, "No subscriptions found for token " + subToken);
            return;
        }
        var key = sub.key;
        var callback = sub.callback;
        this._subsByNum.delete(subToken);
        // Remove this callback set from our tracking lists
        StoreBase._pendingCallbacks.delete(callback);
        var callbacks = this._subscriptions.get(key);
        if (!callbacks) {
            utils_1.assert(callbacks, "No subscriptions under key " + key);
            return;
        }
        var index = callbacks.indexOf(callback);
        if (index !== -1) {
            callbacks.splice(index, 1);
            if (callbacks.length === 0) {
                // No more callbacks for key, so clear it out
                this._subscriptions.delete(key);
                // Last manual unsubscription for this key.  See if we also aren't already tracking an auto subscription for it.
                if (!this._autoSubscriptions.has(key)) {
                    this._stoppedTrackingSub(key === StoreBase.Key_All ? undefined : key);
                }
            }
        }
        else {
            utils_1.assert(false, 'Subscription not found during unsubscribe...');
        }
    };
    StoreBase.prototype.trackAutoSubscription = function (subscription) {
        var key = subscription.key;
        var callbacks = this._autoSubscriptions.get(key);
        if (!callbacks) {
            this._autoSubscriptions.set(key, [subscription]);
            // First autosubscription for this key.  See if we also aren't already tracking a manual subscription for it.
            if (!this._subscriptions.has(key)) {
                this._startedTrackingSub(key === StoreBase.Key_All ? undefined : key);
            }
        }
        else {
            callbacks.push(subscription);
        }
    };
    StoreBase.prototype.removeAutoSubscription = function (subscription) {
        var key = subscription.key;
        var subs = this._autoSubscriptions.get(key);
        if (!subs) {
            utils_1.assert(subs, "No subscriptions under key " + key);
            return;
        }
        var oldLength = subs.length;
        utils_1.remove(subs, function (sub) { return sub === subscription; });
        utils_1.assert(subs.length === oldLength - 1, 'Subscription not found during unsubscribe...');
        StoreBase._pendingCallbacks.delete(subscription.callback);
        if (subs.length === 0) {
            // No more callbacks for key, so clear it out
            this._autoSubscriptions.delete(key);
            // Last autosubscription for this key.  See if we also aren't already tracking a manual subscription for it.
            if (!this._subscriptions.has(key)) {
                this._stoppedTrackingSub(key === StoreBase.Key_All ? undefined : key);
            }
        }
    };
    StoreBase.prototype._startedTrackingSub = function (key) {
        // Virtual function, noop default behavior
    };
    StoreBase.prototype._stoppedTrackingSub = function (key) {
        // Virtual function, noop default behavior
    };
    StoreBase.prototype._getSubscriptionKeys = function () {
        return __spread(Array.from(this._subscriptions.keys()), Array.from(this._autoSubscriptions.keys()));
    };
    StoreBase.prototype._isTrackingKey = function (key) {
        return this._subscriptions.has(key) || this._autoSubscriptions.has(key);
    };
    StoreBase._storeIdCounter = 0;
    // eslint-disable-next-line
    StoreBase.Key_All = '%!$all';
    StoreBase._triggerPending = false;
    StoreBase._isTriggering = false;
    StoreBase._triggerBlockCount = 0;
    StoreBase._bypassThrottle = false;
    StoreBase._pendingCallbacks = new Map();
    return StoreBase;
}());
exports.StoreBase = StoreBase;
