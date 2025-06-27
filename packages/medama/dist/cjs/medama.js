"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMedama = void 0;
const selectorStore_1 = require("./selectorStore");
const state_1 = require("./state");
const createMedama = (initState) => {
    let state = (0, state_1.createStateImage)(initState);
    let selectorStore = (0, selectorStore_1.createSelectorStore)(state.runOverState);
    const resetInit = () => {
        state.resetQueue();
    };
    const subscribeToState = (selector, subscription) => {
        try {
            return selectorStore.subscribeToStateInSelectorStore(selector, subscription);
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
            return state.setState(stateChange);
        }
        catch (e) {
            resetInit();
            throw e;
        }
    };
    const resetState = (initState) => {
        const newState = (0, state_1.createStateImage)(initState);
        const newSelectorStore = (0, selectorStore_1.createSelectorStore)(newState.runOverState);
        state = newState;
        selectorStore = newSelectorStore;
        resetInit();
    };
    const pupil = { subscribeToState, resetState, setState, readState };
    return Object.assign(pupil, { pupil });
};
exports.createMedama = createMedama;
//# sourceMappingURL=medama.js.map