import { createSelectorRecord, } from './queue-and-selector-management';
export const createSelectorStore = (runOverState) => {
    const selectorSubscriptionStore = new WeakMap();
    const getSelectorRecord = (selector) => {
        let selectorRecord;
        if (!selectorSubscriptionStore.has(selector)) {
            const { calculateValue, manageSubscriptions, unsubscribe } = createSubscriptionManagementForSelector(selector, runOverState);
            selectorRecord = createSelectorRecord(calculateValue, manageSubscriptions, unsubscribe);
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
const createSubscriptionManagementForSelector = (selector, runOverState) => {
    let collectedKeyHandles;
    let unsubscribeChunks;
    const keyHandleCollector = (keyHandle) => {
        collectedKeyHandles !== null && collectedKeyHandles !== void 0 ? collectedKeyHandles : (collectedKeyHandles = new Set());
        collectedKeyHandles.add(keyHandle);
    };
    const calculateValue = () => runOverState(selector, collectedKeyHandles ? undefined : keyHandleCollector);
    const manageSubscriptions = (immediateTask, selectorTrigger) => {
        const unsubscribeChunksIsToPopulate = !unsubscribeChunks;
        unsubscribeChunks !== null && unsubscribeChunks !== void 0 ? unsubscribeChunks : (unsubscribeChunks = []);
        collectedKeyHandles === null || collectedKeyHandles === void 0 ? void 0 : collectedKeyHandles.forEach((handle) => {
            const unsubscribeCallback = handle(immediateTask, selectorTrigger);
            unsubscribeChunksIsToPopulate && (unsubscribeChunks === null || unsubscribeChunks === void 0 ? void 0 : unsubscribeChunks.push(unsubscribeCallback));
        });
    };
    const unsubscribe = () => {
        unsubscribeChunks === null || unsubscribeChunks === void 0 ? void 0 : unsubscribeChunks.forEach((unsubscribe) => {
            unsubscribe();
        });
    };
    return { calculateValue, manageSubscriptions, unsubscribe };
};
//# sourceMappingURL=selectorStore.js.map