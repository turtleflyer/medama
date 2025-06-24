export const createSelectorRecord = (calculateValue, manageSubscriptions, unsubscribe) => {
    let isRegistered = false;
    const unregisterTrigger = () => {
        if (!isRegistered)
            return;
        unsubscribe();
        isRegistered = false;
    };
    let memValue;
    let isToRecalculateValue = true;
    const runSelectorWithMemoization = () => {
        if (!isToRecalculateValue)
            return;
        memValue = calculateValue();
        isToRecalculateValue = false;
    };
    let isToAddFlag = true;
    const immediateTask = () => {
        isToRecalculateValue = true;
    };
    const jobs = new Set();
    const selectorTrigger = {
        trigger: () => {
            isToAddFlag = true;
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
            const toReturn = isToAddFlag;
            isToAddFlag = false;
            return toReturn;
        },
    };
    const registerTrigger = () => {
        if (isRegistered)
            return;
        manageSubscriptions(immediateTask, selectorTrigger);
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
    return { addSubscription, getValue };
};
//# sourceMappingURL=selectorRecord.js.map