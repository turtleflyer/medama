export const createSelectorStore = (registerSelectorTrigger) => {
    const selectorSubscriptionStore = new WeakMap();
    const getSelectorRecord = (selector) => {
        var _a;
        const selectorRecord = (_a = selectorSubscriptionStore.get(selector)) !== null && _a !== void 0 ? _a : createSelectorRecord(selector, registerSelectorTrigger);
        selectorSubscriptionStore.set(selector, selectorRecord);
        return selectorRecord;
    };
    const getSelectorValue = (selector) => {
        const { getValue } = getSelectorRecord(selector);
        return getValue();
    };
    const subscribeToStateInSelectorStore = (selector, subscription) => {
        const { addSubscription, getValue } = getSelectorRecord(selector);
        const possibleSubscriptionJob = subscription(getValue());
        return addSubscription(possibleSubscriptionJob !== null && possibleSubscriptionJob !== void 0 ? possibleSubscriptionJob : subscription);
    };
    return { getSelectorValue, subscribeToStateInSelectorStore };
};
export const createSelectorRecord = (selector, registerSelectorTrigger) => {
    let value;
    let toRecalculateValue = true;
    let registered = true;
    const jobs = new Set();
    const calculateValue = () => readState(selector);
    const addSubscription = (subscriptionJob) => {
        jobs.add(subscriptionJob);
        return () => {
            jobs.delete(subscriptionJob);
        };
    };
    const getValue = () => {
        if (!registered) {
            registerSelectorTrigger(selectorTrigger);
            registered = true;
        }
        toRecalculateValue && (value = calculateValue());
        toRecalculateValue = false;
        return value;
    };
    const selectorTrigger = () => {
        if (jobs.size === 0) {
            toRecalculateValue = true;
            registered = false;
            return false;
        }
        value = calculateValue();
        jobs.forEach((job) => {
            job(value);
        });
        return true;
    };
    const readState = registerSelectorTrigger(selectorTrigger);
    return { addSubscription, getValue };
};
//# sourceMappingURL=selectorStore.js.map