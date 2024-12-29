import type {
  CreateMedama,
  ReadState,
  ResetState,
  Resubscribe,
  Selector,
  SetState,
  SubscribeToState,
  Subscription,
} from './medama.types';
import { createSelectorStore } from './selectorStore';
import { createStateImage } from './state';

export const createMedama: CreateMedama = <State extends object>(initState?: Partial<State>) => {
  let state = createStateImage(initState);

  let selectorStore = createSelectorStore(state.registerSelectorTrigger);

  let flagSubscriptionInProgress = false;
  let flagStateUpdating = false;

  const resetInit = () => {
    flagSubscriptionInProgress = false;
    flagStateUpdating = false;
  };

  const subscribeToState: SubscribeToState<State> = <V>(
    selector: Selector<State, V>,
    subscription: Subscription<V>
  ) => {
    try {
      flagSubscriptionInProgress = true;

      const toReturn = createResubscribeStore<V>((sub) =>
        selectorStore.subscribeToStateInSelectorStore(selector, sub)
      );

      toReturn.resubscribe(subscription);
      flagSubscriptionInProgress = false;

      return toReturn;
    } catch (e) {
      resetInit();

      throw e;
    }
  };

  const readState: ReadState<State> = (selector) => {
    try {
      return selectorStore.getSelectorValue(selector);
    } catch (e) {
      resetInit();

      throw e;
    }
  };

  const setState: SetState<State> = (stateChange) => {
    try {
      if (flagSubscriptionInProgress)
        throw new Error('Medama Error: The state update occurs during a subscription');

      if (flagStateUpdating)
        throw new Error('Medama Error: A subscription job launches the state update');

      flagStateUpdating = true;

      const mergeToState =
        typeof stateChange === 'function'
          ? selectorStore.getSelectorValue(stateChange)
          : stateChange;

      state.writeState(mergeToState);
      flagStateUpdating = false;

      return mergeToState;
    } catch (e) {
      resetInit();

      throw e;
    }
  };

  const resetState: ResetState<State> = (initState) => {
    const newState = createStateImage(initState);
    const newSelectorStore = createSelectorStore(newState.registerSelectorTrigger);
    state = newState;
    selectorStore = newSelectorStore;
  };

  const pupil = { subscribeToState, resetState, setState, readState };

  return { ...pupil, pupil };
};

const createResubscribeStore = <V>(subscribe: (subscription: Subscription<V>) => () => void) => {
  let unsubscribeFromRecentSubscription: (() => void) | null = null;

  const unsubscribe = () => {
    unsubscribeFromRecentSubscription?.();
    unsubscribeFromRecentSubscription = null;
  };

  const resubscribe: Resubscribe<V> = (subscription) => {
    unsubscribeFromRecentSubscription?.();
    unsubscribeFromRecentSubscription = subscribe(subscription);
  };

  return { unsubscribe, resubscribe };
};
