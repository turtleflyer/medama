"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMedama = void 0;
const selectorStore_1 = require("./selectorStore");
const state_1 = require("./state");
const createMedama = (initState) => {
    let state = (0, state_1.createStateImage)(initState);
    let selectorStore = (0, selectorStore_1.createSelectorStore)(state.registerSelectorTrigger);
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
        const newState = (0, state_1.createStateImage)(initState);
        const newSelectorStore = (0, selectorStore_1.createSelectorStore)(newState.registerSelectorTrigger);
        state = newState;
        selectorStore = newSelectorStore;
    };
    const pupil = { subscribeToState, resetState, setState, readState };
    return Object.assign(Object.assign({}, pupil), { pupil });
};
exports.createMedama = createMedama;
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