type RunWithReadModeOn = (job: () => void) => void;
type ReadWorkModeMethods = {
    getReadWorkState: () => boolean;
    runWithReadModeOn: RunWithReadModeOn;
    setSubscriptionMeansRequested: () => void;
    getRequestSubscriptionMeansState: () => boolean;
    resetReadWorkMode: () => void;
};
export declare const createReadWorkModeManager: () => ReadWorkModeMethods;
export type DeferOrRun = (job: () => void) => void;
type Reset = () => void;
type ConditionalDeferrerMethods = {
    deferOrRun: DeferOrRun;
    reset: Reset;
};
type CreateConditionalDeferrer = (deferJob: (job: () => void) => void, resolveDeferred: () => void) => ConditionalDeferrerMethods;
type UpdateWorkModeMethods = {
    getUpdateWorkState: () => boolean;
    startUpdating: () => void;
    signalDeferredJobsToResolve: () => void;
    createConditionalDeferrer: CreateConditionalDeferrer;
    resetUpdateWorkMode: () => void;
};
export declare const createUpdateWorkModeManager: () => UpdateWorkModeMethods;
export {};
//# sourceMappingURL=modeManager.d.ts.map