"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUpdateWorkModeManager = exports.createReadWorkModeManager = void 0;
const medama_1 = require("medama");
const createReadWorkModeManager = () => {
    let readWorkState = false;
    let requestSubscriptionMeansState = false;
    const getReadWorkState = () => readWorkState;
    const startReading = () => {
        readWorkState = true;
    };
    const finishReading = () => {
        readWorkState = false;
        requestSubscriptionMeansState = false;
    };
    const setSubscriptionMeansRequested = () => {
        requestSubscriptionMeansState = true;
    };
    const getRequestSubscriptionMeansState = () => requestSubscriptionMeansState;
    const resetReadWorkMode = () => {
        readWorkState = false;
        requestSubscriptionMeansState = false;
    };
    return {
        getReadWorkState,
        startReading,
        finishReading,
        setSubscriptionMeansRequested,
        getRequestSubscriptionMeansState,
        resetReadWorkMode,
    };
};
exports.createReadWorkModeManager = createReadWorkModeManager;
const createUpdateWorkModeManager = () => {
    let updateWorkState = false;
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
    const createConditionalDeferrer = (deferJob, resolveDeferred) => {
        let subscribed = false;
        return {
            deferOrRun: (job) => {
                if (updateWorkState === false) {
                    job();
                    return;
                }
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
    const resetUpdateWorkMode = () => {
        resetSignalState();
        updateWorkState = false;
    };
    return {
        getUpdateWorkState,
        startUpdating,
        signalDeferredJobsToResolve,
        createConditionalDeferrer,
        resetUpdateWorkMode,
    };
};
exports.createUpdateWorkModeManager = createUpdateWorkModeManager;
//# sourceMappingURL=modeManager.js.map