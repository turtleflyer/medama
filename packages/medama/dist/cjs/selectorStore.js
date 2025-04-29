"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSelectorRecord = exports.createSelectorStore = void 0;
const createSelectorStore = (runOverState) => {
    const selectorSubscriptionStore = new WeakMap();
    const getSelectorRecord = (selector) => {
        var _a;
        const selectorRecord = (_a = selectorSubscriptionStore.get(selector)) !== null && _a !== void 0 ? _a : (0, exports.createSelectorRecord)(selector, runOverState);
        selectorSubscriptionStore.set(selector, selectorRecord);
        return selectorRecord;
    };
    const getSelectorValue = (selector) => {
        const { getValue } = getSelectorRecord(selector);
        return getValue();
    };
    const subscribeToStateInSelectorStore = (selector, subscription) => {
        let unsubscribeHandle = null;
        let currentRevealedSubscriptionJob;
        const evaluateAndSubscribe = (subscriptionToReveal) => {
            const { addSubscription, getValue } = getSelectorRecord(selector);
            const possibleSubscriptionJob = subscriptionToReveal(getValue());
            currentRevealedSubscriptionJob =
                typeof possibleSubscriptionJob === 'function'
                    ? possibleSubscriptionJob
                    : subscriptionToReveal;
            unsubscribeHandle = addSubscription(currentRevealedSubscriptionJob);
        };
        evaluateAndSubscribe(subscription);
        const unsubscribe = () => {
            unsubscribeHandle === null || unsubscribeHandle === void 0 ? void 0 : unsubscribeHandle();
            unsubscribeHandle = null;
        };
        const resubscribe = (subscriptionToResubscribe) => {
            unsubscribe();
            evaluateAndSubscribe(subscriptionToResubscribe);
        };
        return { unsubscribe, resubscribe };
    };
    return { getSelectorValue, subscribeToStateInSelectorStore };
};
exports.createSelectorStore = createSelectorStore;
const createSelectorRecord = (selector, runOverState) => {
    const collectedKeyHandles = new Set();
    const keyHandleCollector = (keyHandle) => {
        collectedKeyHandles.add(keyHandle);
    };
    const unregisterTriggerHandleCallbacks = new Set();
    let isRegistered = false;
    const registerTrigger = (isToPopulateUnregisterCallbacks = false) => {
        if (isRegistered)
            return;
        collectedKeyHandles.forEach((handle) => {
            const callback = handle(selectorTrigger);
            isToPopulateUnregisterCallbacks && unregisterTriggerHandleCallbacks.add(callback);
        });
        isRegistered = true;
    };
    const unregisterTrigger = () => {
        unregisterTriggerHandleCallbacks.forEach((callback) => {
            callback();
        });
    };
    let memValue;
    let isToRecalculateValue = false;
    const runSelectorWithMemoization = () => {
        if (isToRecalculateValue) {
            memValue = runOverState(selector);
            isToRecalculateValue = false;
        }
    };
    const jobs = new Set();
    const selectorTrigger = () => {
        isToRecalculateValue = true;
        if (jobs.size === 0) {
            unregisterTrigger();
            isRegistered = false;
            return;
        }
        runSelectorWithMemoization();
        jobs.forEach((job) => {
            job(memValue);
        });
    };
    const addSubscription = (subscriptionJob) => {
        jobs.add(subscriptionJob);
        return () => {
            jobs.delete(subscriptionJob);
        };
    };
    const getValue = () => {
        runSelectorWithMemoization();
        registerTrigger();
        return memValue;
    };
    memValue = runOverState(selector, keyHandleCollector);
    registerTrigger(true);
    return { addSubscription, getValue };
};
exports.createSelectorRecord = createSelectorRecord;
//# sourceMappingURL=selectorStore.js.map