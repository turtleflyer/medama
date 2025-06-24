import { createSelectorStore } from './selectorStore';
import { createStateImage } from './state';
export const createMedama = (initState) => {
    let state = createStateImage(initState);
    let selectorStore = createSelectorStore(state.runOverState);
    const resetInit = () => {
        state.resetQueue();
    };
    const subscribeToState = (selector, subscription) => {
        try {
            const toReturn = selectorStore.subscribeToStateInSelectorStore(selector, subscription);
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
            const toReturn = state.setState(stateChange);
            return toReturn;
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
    return Object.assign(pupil, { pupil });
};
//# sourceMappingURL=medama.js.map