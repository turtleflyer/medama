"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSelectorStore = void 0;
const queue_and_selector_management_1 = require("./queue-and-selector-management");
const createSelectorStore = (runOverState) => {
    const selectorSubscriptionStore = new WeakMap();
    const getSelectorRecord = (selector) => {
        let selectorRecord;
        if (!selectorSubscriptionStore.has(selector)) {
            const { calculateValue, manageSubscriptions, unsubscribe } = createSubscriptionManagementForSelector(selector, runOverState);
            selectorRecord = (0, queue_and_selector_management_1.createSelectorRecord)(calculateValue, manageSubscriptions, unsubscribe);
            selectorSubscriptionStore.set(selector, selectorRecord);
        }
        else {
            selectorRecord = selectorSubscriptionStore.get(selector);
        }
        return selectorRecord;
    };
    const getSelectorValue = (selector) => {
        const { getValue } = getSelectorRecord(selector);
        return getValue();
    };
    const subscribeToStateInSelectorStore = (selector, subscription) => {
        let currentSelector = selector;
        let unsubscribeHandle;
        let currentRevealedSubscriptionJob;
        const evaluateAndSubscribe = (subscriptionToReveal) => {
            const { addSubscription, getValue } = getSelectorRecord(currentSelector);
            let beenCalledPrematurely = false;
            let subscriptionPlaceholder = () => {
                beenCalledPrematurely = true;
            };
            unsubscribeHandle = addSubscription((v) => subscriptionPlaceholder(v));
            let potentialSubscriptionJob;
            try {
                potentialSubscriptionJob = subscriptionToReveal(getValue());
            }
            catch (E) {
                unsubscribeHandle();
                unsubscribeHandle = undefined;
                throw E;
            }
            currentRevealedSubscriptionJob =
                typeof potentialSubscriptionJob === 'function'
                    ? potentialSubscriptionJob
                    : subscriptionToReveal;
            subscriptionPlaceholder = currentRevealedSubscriptionJob;
            if (beenCalledPrematurely)
                currentRevealedSubscriptionJob(getValue());
        };
        evaluateAndSubscribe(subscription);
        const unsubscribe = () => {
            unsubscribeHandle === null || unsubscribeHandle === void 0 ? void 0 : unsubscribeHandle();
            unsubscribeHandle = undefined;
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
const createSubscriptionManagementForSelector = (selector, runOverState) => {
    let collectedKeyHandles;
    let unsubscribeChunks;
    const keyHandleCollector = (keyHandle) => {
        (collectedKeyHandles !== null && collectedKeyHandles !== void 0 ? collectedKeyHandles : (collectedKeyHandles = new Set())).add(keyHandle);
    };
    const calculateValue = () => runOverState(selector, collectedKeyHandles ? undefined : keyHandleCollector);
    const manageSubscriptions = (immediateTask, selectorTrigger) => {
        const unsubscribeChunksIsToPopulate = !unsubscribeChunks;
        collectedKeyHandles === null || collectedKeyHandles === void 0 ? void 0 : collectedKeyHandles.forEach((keyHandle) => {
            const unsubscribeCallback = keyHandle(immediateTask, selectorTrigger);
            unsubscribeChunksIsToPopulate && (unsubscribeChunks !== null && unsubscribeChunks !== void 0 ? unsubscribeChunks : (unsubscribeChunks = [])).push(unsubscribeCallback);
        });
    };
    const unsubscribe = () => {
        unsubscribeChunks === null || unsubscribeChunks === void 0 ? void 0 : unsubscribeChunks.forEach((unsubscribe) => {
            unsubscribe();
        });
        unsubscribeChunks = undefined;
    };
    return { calculateValue, manageSubscriptions, unsubscribe };
};
//# sourceMappingURL=selectorStore.js.map