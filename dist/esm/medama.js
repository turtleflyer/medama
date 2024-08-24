import { compose, lazily } from 'alnico';
import { createSelectorStore } from './selectorStore';
import { createStateImage } from './state';
export const createMedama = (initState) =>
  compose(
    {
      state: createStateImage(initState),
      selectorStore: lazily(({ state }) =>
        createSelectorStore(state.get().registerSelectorTrigger)
      ),
    },
    {
      subscribeToState: ({ selectorStore }, selector, subscription) => {
        const toReturn = createResubscribeStore((sub) =>
          selectorStore.get().subscribeToStateInSelectorStore(selector, sub)
        );
        toReturn.resubscribe(subscription);
        return toReturn;
      },
      readState: ({ selectorStore }, selector) => selectorStore.get().getSelectorValue(selector),
      setState: ({ state, selectorStore }, stateChange) => {
        const mergeToState =
          typeof stateChange === 'function'
            ? selectorStore.get().getSelectorValue(stateChange)
            : stateChange;
        state.get().writeState(mergeToState);
        return mergeToState;
      },
      resetState: ({ state, selectorStore }, initState) => {
        const newState = createStateImage(initState);
        const newSelectorStore = createSelectorStore(newState.registerSelectorTrigger);
        state.set(newState);
        selectorStore.set(newSelectorStore);
      },
    },
    {
      pupil: lazily(({ subscribeToState, readState, setState, resetState }) => ({
        subscribeToState,
        readState,
        setState,
        resetState,
      })),
    }
  );
const createResubscribeStore = (subscribe) =>
  compose(
    {
      unsubscribeFromRecentSubscription: null,
    },
    {
      unsubscribe: ({ unsubscribeFromRecentSubscription }) => {
        var _a;
        (_a = unsubscribeFromRecentSubscription.exc(null)) === null || _a === void 0
          ? void 0
          : _a();
      },
      resubscribe: ({ unsubscribeFromRecentSubscription }, subscription) => {
        var _a;
        (_a = unsubscribeFromRecentSubscription.get()) === null || _a === void 0 ? void 0 : _a();
        unsubscribeFromRecentSubscription.set(subscribe(subscription));
      },
    }
  );
//# sourceMappingURL=medama.js.map
