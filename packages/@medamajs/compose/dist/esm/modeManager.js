import { createMedama, selectStateEntriesChanged, } from 'medama';
export const createReadWorkModeManager = () => {
    let requestSubscriptionMeansState = false;
    const runWithSubscriptionMeansRequested = (job) => {
        requestSubscriptionMeansState = true;
        const toReturn = job();
        requestSubscriptionMeansState = false;
        return toReturn;
    };
    const getRequestSubscriptionMeansState = () => requestSubscriptionMeansState;
    const resetReadWorkMode = () => {
        requestSubscriptionMeansState = false;
    };
    return {
        runWithSubscriptionMeansRequested,
        getRequestSubscriptionMeansState,
        resetReadWorkMode,
    };
};
export const createUpdateWorkModeManager = () => {
    let updateWorkState = false;
    const layerSubscriptionStore = new WeakMap();
    const getUpdateWorkState = () => updateWorkState;
    const startUpdating = () => {
        updateWorkState = true;
    };
    const { subscribeToState: subscribeToSignalState, setState: setSignalState, resetState: resetSignalState, } = createMedama();
    const signalToResolveSelector = ({ signal }) => signal;
    const signalDeferredJobsToResolve = () => {
        setSignalState({ signal: {} });
        updateWorkState = false;
    };
    const subscribeForResolvingWhenSignalled = (callback) => {
        const { unsubscribe } = subscribeToSignalState(signalToResolveSelector, () => () => {
            callback();
            unsubscribe();
        });
    };
    let subscriptionRegistered = false;
    const createDeferrer = (deferJob, resolveDeferred) => {
        let subscribed = false;
        return {
            defer: (runImmediately, job) => {
                runImmediately();
                deferJob(job);
                if (subscribed)
                    return;
                subscriptionRegistered = true;
                subscribeForResolvingWhenSignalled(() => {
                    subscriptionRegistered = false;
                    resolveDeferred();
                    subscribed = false;
                });
                subscribed = true;
            },
            reset: () => {
                subscribed = false;
            },
        };
    };
    const createLayerSubscriptionRecord = (subscribeToLayer) => {
        let countJobs = 0;
        let unsubscribeSignalTrigger;
        const signalTrigger = () => () => {
            !updateWorkState && subscriptionRegistered && setSignalState({ signal: {} });
        };
        const subscribeAndManageDeferring = (selector, subscription) => {
            countJobs++ === 0 &&
                (unsubscribeSignalTrigger = subscribeToLayer(selectStateEntriesChanged, signalTrigger).unsubscribe);
            const { unsubscribe } = subscribeToLayer(selector, () => subscription);
            return () => {
                --countJobs === 0 && (unsubscribeSignalTrigger === null || unsubscribeSignalTrigger === void 0 ? void 0 : unsubscribeSignalTrigger());
                unsubscribe();
            };
        };
        return {
            subscribeAndManageDeferring,
        };
    };
    const getSubscribeToLayerWithSelector = (subscribeToLayer, selector) => {
        var _a;
        const signalSubscriptionRecord = (_a = layerSubscriptionStore.get(subscribeToLayer)) !== null && _a !== void 0 ? _a : createLayerSubscriptionRecord(subscribeToLayer);
        layerSubscriptionStore.set(subscribeToLayer, signalSubscriptionRecord);
        const { subscribeAndManageDeferring } = signalSubscriptionRecord;
        signalSubscriptionRecord.subscribeAndManageDeferring;
        return (subscription) => subscribeAndManageDeferring(selector, subscription);
    };
    const resetUpdateWorkMode = () => {
        resetSignalState();
        updateWorkState = false;
    };
    return {
        getUpdateWorkState,
        startUpdating,
        signalDeferredJobsToResolve,
        createDeferrer,
        getSubscribeToLayerWithSelector,
        resetUpdateWorkMode,
    };
};
//# sourceMappingURL=modeManager.js.map