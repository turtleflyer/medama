import { createSelectorStore } from './selectorStore';
import { createStateImage } from './state';
export const createMedama = (initState) => {
  let state = createStateImage(initState);
  let selectorStore = createSelectorStore(state.registerSelectorTrigger);
  const subscribeToState = (selector, subscription) => {
    const toReturn = createResubscribeStore((sub) =>
      selectorStore.subscribeToStateInSelectorStore(selector, sub)
    );
    toReturn.resubscribe(subscription);
    return toReturn;
  };
  const readState = (selector) => selectorStore.getSelectorValue(selector);
  const setState = (stateChange) => {
    const mergeToState =
      typeof stateChange === 'function' ? selectorStore.getSelectorValue(stateChange) : stateChange;
    state.writeState(mergeToState);
    return mergeToState;
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
    unsubscribeFromRecentSubscription === null || unsubscribeFromRecentSubscription === void 0
      ? void 0
      : unsubscribeFromRecentSubscription();
    unsubscribeFromRecentSubscription = null;
  };
  const resubscribe = (subscription) => {
    unsubscribeFromRecentSubscription === null || unsubscribeFromRecentSubscription === void 0
      ? void 0
      : unsubscribeFromRecentSubscription();
    unsubscribeFromRecentSubscription = subscribe(subscription);
  };
  return { unsubscribe, resubscribe };
};
//# sourceMappingURL=medama.js.map
