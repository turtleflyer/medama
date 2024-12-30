import { createSelectorStore } from './selectorStore';
import { createStateImage } from './state';
export const createMedama = (initState) => {
    let state = createStateImage(initState);
    let selectorStore = createSelectorStore(state.registerSelectorTrigger);
    let flagSubscriptionInProgress = false;
    let flagStateUpdating = false;
    const resetInit = () => {
        flagSubscriptionInProgress = false;
        flagStateUpdating = false;
    };
    const subscribeToState = (selector, subscription) => {
        try {
            flagSubscriptionInProgress = true;
            const toReturn = createResubscribeStore((sub) => selectorStore.subscribeToStateInSelectorStore(selector, sub));
            toReturn.resubscribe(subscription);
            flagSubscriptionInProgress = false;
            return toReturn;
        }
        catch (e) {
            resetInit();
            throw e;
        }
    };
    const readState = (selector) => {
        try {
            return selectorStore.getSelectorValue(selector);
        }
        catch (e) {
            resetInit();
            throw e;
        }
    };
    const setState = (stateChange) => {
        try {
            if (flagSubscriptionInProgress)
                throw new Error('Medama Error: The state update occurs during a subscription');
            if (flagStateUpdating)
                throw new Error('Medama Error: A subscription job launches the state update');
            flagStateUpdating = true;
            const mergeToState = typeof stateChange === 'function'
                ? selectorStore.getSelectorValue(stateChange)
                : stateChange;
            state.writeState(mergeToState);
            flagStateUpdating = false;
            return mergeToState;
        }
        catch (e) {
            resetInit();
            throw e;
        }
    };
    const resetState = (initState) => {
        const newState = createStateImage(initState);
        const newSelectorStore = createSelectorStore(newState.registerSelectorTrigger);
        state = newState;
        selectorStore = newSelectorStore;
    };
    const pupil = { subscribeToState, resetState, setState, readState };
    return Object.assign(Object.assign({}, pupil), { pupil });
};
const createResubscribeStore = (subscribe) => {
    let unsubscribeFromRecentSubscription = null;
    const unsubscribe = () => {
        unsubscribeFromRecentSubscription === null || unsubscribeFromRecentSubscription === void 0 ? void 0 : unsubscribeFromRecentSubscription();
        unsubscribeFromRecentSubscription = null;
    };
    const resubscribe = (subscription) => {
        unsubscribeFromRecentSubscription === null || unsubscribeFromRecentSubscription === void 0 ? void 0 : unsubscribeFromRecentSubscription();
        unsubscribeFromRecentSubscription = subscribe(subscription);
    };
    return { unsubscribe, resubscribe };
};
//# sourceMappingURL=medama.js.map