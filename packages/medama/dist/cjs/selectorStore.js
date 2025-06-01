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
        let currentSelector = selector;
        let unsubscribeHandle = null;
        let currentRevealedSubscriptionJob;
        const evaluateAndSubscribe = (subscriptionToReveal) => {
            const { addSubscription, getValue } = getSelectorRecord(currentSelector);
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
        const transfer = (selectorToTransferTo) => {
            unsubscribe();
            currentSelector = selectorToTransferTo;
            evaluateAndSubscribe(currentRevealedSubscriptionJob);
        };
        return { unsubscribe, resubscribe, transfer };
    };
    return { getSelectorValue, subscribeToStateInSelectorStore };
};
exports.createSelectorStore = createSelectorStore;
const createSelectorRecord = (selector, runOverState) => {
    const unregisterTriggerHandleCallbacks = new Set();
    let isRegistered = false;
    const unregisterTrigger = () => {
        if (!isRegistered)
            return;
        unregisterTriggerHandleCallbacks.forEach((callback) => {
            callback();
        });
        isRegistered = false;
    };
    const collectedKeyHandles = new Set();
    const keyHandleCollector = (keyHandle) => {
        collectedKeyHandles.add(keyHandle);
    };
    let memValue;
    let isToRecalculateValue = false;
    const runSelectorWithMemoization = () => {
        if (isToRecalculateValue) {
            memValue = runOverState(selector);
            isToRecalculateValue = false;
        }
    };
    let isToAddValue = false;
    const immediateTask = () => {
        if (isToRecalculateValue)
            return;
        isToRecalculateValue = true;
        isToAddValue = true;
    };
    const jobs = new Set();
    const selectorTrigger = {
        trigger: () => {
            if (jobs.size === 0) {
                unregisterTrigger();
                return;
            }
            runSelectorWithMemoization();
            jobs.forEach((job) => {
                job(memValue);
            });
        },
        isToAdd: () => {
            return [isToAddValue, (isToAddValue = false)][0];
        },
    };
    const registerTrigger = (isToPopulateUnregisterCallbacks = false) => {
        if (isRegistered)
            return;
        collectedKeyHandles.forEach((handle) => {
            const callback = handle(immediateTask, selectorTrigger);
            isToPopulateUnregisterCallbacks && unregisterTriggerHandleCallbacks.add(callback);
        });
        isRegistered = true;
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