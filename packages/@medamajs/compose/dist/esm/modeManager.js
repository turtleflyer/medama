import { createMedama } from 'medama';
export const createReadWorkModeManager = () => {
    let readWorkState = false;
    let requestSubscriptionMeansState = false;
    const getReadWorkState = () => readWorkState;
    const runWithReadModeOn = (job) => {
        readWorkState = true;
        job();
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
        runWithReadModeOn,
        setSubscriptionMeansRequested,
        getRequestSubscriptionMeansState,
        resetReadWorkMode,
    };
};
export const createUpdateWorkModeManager = () => {
    let updateWorkState = false;
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
//# sourceMappingURL=modeManager.js.map