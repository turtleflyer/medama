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
export type Defer = (runImmediately: () => void, job: () => void) => void;
type Reset = () => void;
type DeferrerMethods = {
    defer: Defer;
    reset: Reset;
};
type CreateDeferrer = (deferJob: (job: () => void) => void, resolveDeferred: () => void) => DeferrerMethods;
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