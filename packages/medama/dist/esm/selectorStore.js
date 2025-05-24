export const createSelectorStore = (runOverState) => {
    const selectorSubscriptionStore = new WeakMap();
    const getSelectorRecord = (selector) => {
        var _a;
        const selectorRecord = (_a = selectorSubscriptionStore.get(selector)) !== null && _a !== void 0 ? _a : createSelectorRecord(selector, runOverState);
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
export const createSelectorRecord = (selector, runOverState) => {
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
    const immediateTask = () => {
        isToRecalculateValue = true;
    };
    const jobs = new Set();
    const selectorTrigger = () => {
        if (jobs.size === 0) {
            unregisterTrigger();
            return;
        }
        runSelectorWithMemoization();
        jobs.forEach((job) => {
            job(memValue);
        });
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
//# sourceMappingURL=selectorStore.js.map