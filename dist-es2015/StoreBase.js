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
import * as Instrumentation from './Instrumentation';
import Options from './Options';
import { assert, isNumber, isString, normalizeKey, normalizeKeys, remove, uniq } from './utils';
export class StoreBase {
    constructor(_throttleMs, _bypassTriggerBlocks = false) {
        this._throttleMs = _throttleMs;
        this._bypassTriggerBlocks = _bypassTriggerBlocks;
        this._subscriptions = new Map();
        this._autoSubscriptions = new Map();
        this._subTokenNum = 1;
        this._subsByNum = new Map();
        this.storeId = `store${StoreBase._storeIdCounter++}`;
        this._handleThrottledCallbacks = () => {
            this._throttleData = undefined;
            StoreBase._resolveCallbacks();
        };
    }
    ;
    static pushTriggerBlock() {
        this._triggerBlockCount++;
    }
    static popTriggerBlock() {
        this._triggerBlockCount--;
        assert(this._triggerBlockCount >= 0, 'Over-popped trigger blocks!');
        if (this._triggerBlockCount === 0) {
            StoreBase._resolveCallbacks();
        }
    }
    static setThrottleStatus(enabled) {
        this._bypassThrottle = !enabled;
        StoreBase._resolveCallbacks();
    }
    // If you trigger a specific set of keys, then it will only trigger that specific set of callbacks (and subscriptions marked
    // as "All" keyed).  If the key is all, it will trigger all callbacks.
    trigger(keyOrKeys) {
        const throttleMs = this._throttleMs !== undefined
            ? this._throttleMs
            : Options.defaultThrottleMs;
        // If we're throttling, save execution time
        let throttledUntil;
        if (throttleMs) {
            if (!this._throttleData) {
                // Needs to accumulate and trigger later -- start a timer if we don't have one running already
                // If there are no callbacks, don't bother setting up the timer
                this._throttleData = {
                    timerId: Options.setTimeout(this._handleThrottledCallbacks, this._throttleMs),
                    callbackTime: Date.now() + throttleMs,
                };
            }
            throttledUntil = this._throttleData.callbackTime;
        }
        const bypassBlock = this._bypassTriggerBlocks;
        // trigger(0) is valid, ensure that we catch this case
        if (!keyOrKeys && !isNumber(keyOrKeys)) {
            // Inspecific key, so generic callback call
            for (const subs of this._subscriptions.values()) {
                for (const sub of subs) {
                    this._setupAllKeySubscription(sub, throttledUntil, bypassBlock);
                }
            }
            for (const subs of this._autoSubscriptions.values()) {
                for (const sub of subs) {
                    this._setupAllKeySubscription(sub.callback, throttledUntil, bypassBlock);
                }
            }
        }
        else {
            const keys = normalizeKeys(keyOrKeys);
            // Key list, so go through each key and queue up the callback
            for (const key of keys) {
                for (const callback of (this._subscriptions.get(key) || [])) {
                    this._setupSpecificKeySubscription([key], callback, throttledUntil, bypassBlock);
                }
                for (const sub of (this._autoSubscriptions.get(key) || [])) {
                    this._setupSpecificKeySubscription([key], sub.callback, throttledUntil, bypassBlock);
                }
            }
            // Go through each of the all-key subscriptions and add the full key list to their gathered list
            for (const callback of (this._subscriptions.get(StoreBase.Key_All) || [])) {
                this._setupSpecificKeySubscription(keys, callback, throttledUntil, bypassBlock);
            }
            for (const sub of (this._autoSubscriptions.get(StoreBase.Key_All) || [])) {
                this._setupSpecificKeySubscription(keys, sub.callback, throttledUntil, bypassBlock);
            }
        }
        if (!throttledUntil || bypassBlock) {
            StoreBase._resolveCallbacks();
        }
    }
    static _updateExistingMeta(meta, throttledUntil, bypassBlock) {
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
    }
    _setupAllKeySubscription(callback, throttledUntil, bypassBlock) {
        const existingMeta = StoreBase._pendingCallbacks.get(callback);
        const newMeta = { keys: null, throttledUntil, bypassBlock };
        // Clear the key list to null for the callback but respect previous throttle/bypass values
        if (existingMeta && throttledUntil && existingMeta.throttledUntil) {
            newMeta.throttledUntil = Math.min(throttledUntil, existingMeta.throttledUntil);
        }
        if (existingMeta && existingMeta.bypassBlock) {
            newMeta.bypassBlock = true;
        }
        StoreBase._pendingCallbacks.set(callback, newMeta);
    }
    _setupSpecificKeySubscription(keys, callback, throttledUntil, bypassBlock) {
        const existingMeta = StoreBase._pendingCallbacks.get(callback);
        StoreBase._updateExistingMeta(existingMeta, throttledUntil, bypassBlock);
        if (existingMeta === undefined) {
            // We need to clone keys in order to prevent accidental by-ref mutations
            StoreBase._pendingCallbacks.set(callback, { keys: [...keys], throttledUntil, bypassBlock });
        }
        else if (existingMeta.keys === null) {
            // Do nothing since it's already an all-key-trigger
        }
        else {
            // Add them all to the end of the list
            // Refrain from using spead operater here, this can result in a stack overflow if a large number of keys are triggered
            const keyCount = keys.length;
            for (let i = 0; i < keyCount; i++) {
                existingMeta.keys.push(keys[i]);
            }
        }
    }
    static _resolveCallbacks() {
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
        let callbacksCount = 0;
        const currentTime = Date.now();
        // Capture the callbacks we need to call
        const callbacks = [];
        for (const [callback, meta] of this._pendingCallbacks) {
            // Block check
            if (StoreBase._triggerBlockCount > 0 && !meta.bypassBlock) {
                continue;
            }
            // Throttle check
            if (meta.throttledUntil && meta.throttledUntil > currentTime && !StoreBase._bypassThrottle) {
                continue;
            }
            // Do a quick dedupe on keys
            const uniquedKeys = meta.keys ? uniq(meta.keys) : meta.keys;
            // Convert null key (meaning "all") to undefined for the callback.
            callbacks.push([callback, uniquedKeys || undefined]);
            this._pendingCallbacks.delete(callback);
        }
        for (const [callback, keys] of callbacks) {
            callbacksCount++;
            callback(keys);
        }
        if (Instrumentation.impl) {
            Instrumentation.impl.endInvokeStoreCallbacks(this.constructor, callbacksCount);
        }
        StoreBase._isTriggering = false;
        if (this._triggerPending) {
            StoreBase._resolveCallbacks();
        }
    }
    // Subscribe to triggered events from this store.  You can leave the default key, in which case you will be
    // notified of any triggered events, or you can use a key to filter it down to specific event keys you want.
    // Returns a token you can pass back to unsubscribe.
    subscribe(callback, rawKey = StoreBase.Key_All) {
        const key = normalizeKey(rawKey);
        // Adding extra type-checks since the key is often the result of following a string path, which is not type-safe.
        assert(key && isString(key), `Trying to subscribe to invalid key: "${key}"`);
        const callbacks = this._subscriptions.get(key);
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
        const token = this._subTokenNum++;
        this._subsByNum.set(token, { key: key, callback: callback });
        return token;
    }
    // Unsubscribe from a previous subscription.  Pass in the token the subscribe function handed you.
    unsubscribe(subToken) {
        const sub = this._subsByNum.get(subToken);
        if (!sub) {
            assert(sub, `No subscriptions found for token ${subToken}`);
            return;
        }
        const key = sub.key;
        const callback = sub.callback;
        this._subsByNum.delete(subToken);
        // Remove this callback set from our tracking lists
        StoreBase._pendingCallbacks.delete(callback);
        const callbacks = this._subscriptions.get(key);
        if (!callbacks) {
            assert(callbacks, `No subscriptions under key ${key}`);
            return;
        }
        const index = callbacks.indexOf(callback);
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
            assert(false, 'Subscription not found during unsubscribe...');
        }
    }
    trackAutoSubscription(subscription) {
        const key = subscription.key;
        const callbacks = this._autoSubscriptions.get(key);
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
    }
    removeAutoSubscription(subscription) {
        const key = subscription.key;
        const subs = this._autoSubscriptions.get(key);
        if (!subs) {
            assert(subs, `No subscriptions under key ${key}`);
            return;
        }
        const oldLength = subs.length;
        remove(subs, sub => sub === subscription);
        assert(subs.length === oldLength - 1, 'Subscription not found during unsubscribe...');
        StoreBase._pendingCallbacks.delete(subscription.callback);
        if (subs.length === 0) {
            // No more callbacks for key, so clear it out
            this._autoSubscriptions.delete(key);
            // Last autosubscription for this key.  See if we also aren't already tracking a manual subscription for it.
            if (!this._subscriptions.has(key)) {
                this._stoppedTrackingSub(key === StoreBase.Key_All ? undefined : key);
            }
        }
    }
    _startedTrackingSub(key) {
        // Virtual function, noop default behavior
    }
    _stoppedTrackingSub(key) {
        // Virtual function, noop default behavior
    }
    _getSubscriptionKeys() {
        return [...Array.from(this._subscriptions.keys()), ...Array.from(this._autoSubscriptions.keys())];
    }
    _isTrackingKey(key) {
        return this._subscriptions.has(key) || this._autoSubscriptions.has(key);
    }
}
StoreBase._storeIdCounter = 0;
// eslint-disable-next-line
StoreBase.Key_All = '%!$all';
StoreBase._triggerPending = false;
StoreBase._isTriggering = false;
StoreBase._triggerBlockCount = 0;
StoreBase._bypassThrottle = false;
StoreBase._pendingCallbacks = new Map();
