'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.createMedama = void 0;
const alnico_1 = require('alnico');
const selectorStore_1 = require('./selectorStore');
const state_1 = require('./state');
const createMedama = (initState) =>
  (0, alnico_1.compose)(
    {
      state: (0, state_1.createStateImage)(initState),
      selectorStore: (0, alnico_1.lazily)(({ state }) =>
        (0, selectorStore_1.createSelectorStore)(state.get().registerSelectorTrigger)
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
        const newState = (0, state_1.createStateImage)(initState);
        const newSelectorStore = (0, selectorStore_1.createSelectorStore)(
          newState.registerSelectorTrigger
        );
        state.set(newState);
        selectorStore.set(newSelectorStore);
      },
    },
    {
      pupil: (0, alnico_1.lazily)(({ subscribeToState, readState, setState, resetState }) => ({
        subscribeToState,
        readState,
        setState,
        resetState,
      })),
    }
  );
exports.createMedama = createMedama;
const createResubscribeStore = (subscribe) =>
  (0, alnico_1.compose)(
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
