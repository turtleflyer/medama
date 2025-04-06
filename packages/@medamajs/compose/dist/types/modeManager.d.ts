type ReadWorkModeMethods = {
    getReadWorkState: () => boolean;
    startReading: () => void;
    finishReading: () => void;
    setSubscriptionMeansRequested: () => void;
    getRequestSubscriptionMeansState: () => boolean;
    resetReadWorkMode: () => void;
};
export declare const createReadWorkModeManager: () => ReadWorkModeMethods;
type ConditionalDeferrerMethods = {
    deferOrRun: (job: () => void) => void;
    reset: () => void;
};
type UpdateWorkModeMethods = {
    getUpdateWorkState: () => boolean;
    startUpdating: () => void;
    signalDeferredJobsToResolve: () => void;
    createConditionalDeferrer: (deferJob: (job: () => void) => void, resolveDeferred: () => void) => ConditionalDeferrerMethods;
    resetUpdateWorkMode: () => void;
};
export declare const createUpdateWorkModeManager: () => UpdateWorkModeMethods;
export {};
//# sourceMappingURL=modeManager.d.ts.map