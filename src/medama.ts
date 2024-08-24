import { compose, lazily } from 'alnico';
import type {
  CreateMedama,
  MedamaMethods,
  ReadState,
  Subscription,
  SubscriptionMethods,
} from './medama.types';
import { createSelectorStore, type SubscribeToStateInSelectorStore } from './selectorStore';
import { createStateImage, type RegisterSelectorTrigger } from './state';

export const createMedama: CreateMedama = <State extends object, K extends keyof State>(
  initState?: Pick<State, K>
) =>
  compose<
    {
      state: {
        writeState: (toWrite: Partial<State>) => void;
        registerSelectorTrigger: RegisterSelectorTrigger<State>;
      };

      selectorStore: {
        getSelectorValue: ReadState<State>;
        subscribeToStateInSelectorStore: SubscribeToStateInSelectorStore<State>;
      };
    },
    MedamaMethods<State>,
    { pupil: MedamaMethods<State> }
  >(
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

const createResubscribeStore = <V>(subscribe: (subscription: Subscription<V>) => () => void) =>
  compose<{ unsubscribeFromRecentSubscription: (() => void) | null }, SubscriptionMethods<V>>(
    {
      unsubscribeFromRecentSubscription: null,
    },

    {
      unsubscribe: ({ unsubscribeFromRecentSubscription }) => {
        unsubscribeFromRecentSubscription.exc(null)?.();
      },

      resubscribe: ({ unsubscribeFromRecentSubscription }, subscription) => {
        unsubscribeFromRecentSubscription.get()?.();
        unsubscribeFromRecentSubscription.set(subscribe(subscription));
      },
    }
  );
