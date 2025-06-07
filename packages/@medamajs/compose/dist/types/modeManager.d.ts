import { type Selector, type SubscribeToState, type UnsubscribeFromState } from 'medama';
type RunWithReadModeOn = (job: () => void) => void;
type ReadWorkModeMethods = {
    getReadWorkState: () => boolean;
    runWithReadModeOn: RunWithReadModeOn;
    setSubscriptionMeansRequested: () => void;
    getRequestSubscriptionMeansState: () => boolean;
    resetReadWorkMode: () => void;
};
export declare const createReadWorkModeManager: () => ReadWorkModeMethods;
export type Defer<Job> = (runImmediately: () => void, job: Job) => void;
type Reset = () => void;
type DeferrerMethods<Job> = {
    defer: Defer<Job>;
    reset: Reset;
};
type CreateDeferrer = <Job>(deferJob: (job: Job) => void, resolveDeferred: () => void) => DeferrerMethods<Job>;
export type SubscribeToLayerWithSelector = (subscription: () => void) => UnsubscribeFromState;
type GetSubscribeToLayerWithSelector = (subscribeToLayer: SubscribeToState<{}>, selector: Selector<{}, void>) => SubscribeToLayerWithSelector;
type UpdateWorkModeMethods = {
    getUpdateWorkState: () => boolean;
    startUpdating: () => void;
    signalDeferredJobsToResolve: () => void;
    createDeferrer: CreateDeferrer;
    getSubscribeToLayerWithSelector: GetSubscribeToLayerWithSelector;
    resetUpdateWorkMode: () => void;
};
export declare const createUpdateWorkModeManager: () => UpdateWorkModeMethods;
export {};
//# sourceMappingURL=modeManager.d.ts.map