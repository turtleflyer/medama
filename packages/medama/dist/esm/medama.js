import { createSelectorStore } from './selectorStore';
import { createStateImage } from './state';
export const createMedama = (initState) => {
    let state = createStateImage(initState);
    let selectorStore = createSelectorStore(state.runOverState);
    let flagSubscriptionInProgress = false;
    let flagStateUpdating = false;
    const resetInit = () => {
        flagSubscriptionInProgress = false;
        flagStateUpdating = false;
    };
    const subscribeToState = (selector, subscription) => {
        try {
            flagSubscriptionInProgress = true;
            return [
                selectorStore.subscribeToStateInSelectorStore(selector, subscription),
                (flagSubscriptionInProgress = false),
            ][0];
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
            return [state.setState(stateChange), (flagStateUpdating = false)][0];
        }
        catch (e) {
            resetInit();
            throw e;
        }
    };
    const resetState = (initState) => {
        const newState = createStateImage(initState);
        const newSelectorStore = createSelectorStore(newState.runOverState);
        state = newState;
        selectorStore = newSelectorStore;
        resetInit();
    };
    const pupil = { subscribeToState, resetState, setState, readState };
    return Object.assign(Object.assign({}, pupil), { pupil });
};
//# sourceMappingURL=medama.js.map