"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUpdateWorkModeManager = exports.createReadWorkModeManager = void 0;
const medama_1 = require("medama");
const createReadWorkModeManager = () => {
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
exports.createReadWorkModeManager = createReadWorkModeManager;
const createUpdateWorkModeManager = () => {
    let updateWorkState = false;
    const layerSubscriptionStore = new WeakMap();
    const getUpdateWorkState = () => updateWorkState;
    const startUpdating = () => {
        updateWorkState = true;
    };
    const { subscribeToState: subscribeToSignalState, setState: setSignalState, resetState: resetSignalState, } = (0, medama_1.createMedama)();
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
    const createDeferrer = (deferJob, resolveDeferred) => {
        let subscribed = false;
        return {
            defer: (runImmediately, job) => {
                runImmediately();
                deferJob(job);
                if (subscribed)
                    return;
                subscribeForResolvingWhenSignalled(() => {
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
            updateWorkState || setSignalState({ signal: {} });
        };
        const subscribeAndManageDeferring = (selector, subscription) => {
            countJobs++ === 0 &&
                (unsubscribeSignalTrigger = subscribeToLayer(medama_1.selectStateEntriesChanged, signalTrigger).unsubscribe);
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
exports.createUpdateWorkModeManager = createUpdateWorkModeManager;
//# sourceMappingURL=modeManager.js.map