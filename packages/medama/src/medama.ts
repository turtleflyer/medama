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

  const subscribeToState: SubscribeToState<State> = <V>(
    selector: Selector<State, V>,
    subscription: Subscription<V>
  ) => {
    const toReturn = createResubscribeStore<V>((sub) =>
      selectorStore.subscribeToStateInSelectorStore(selector, sub)
    );

    toReturn.resubscribe(subscription);

    return toReturn;
  };

  const readState: ReadState<State> = (selector) => selectorStore.getSelectorValue(selector);

  const setState: SetState<State> = (stateChange) => {
    const mergeToState =
      typeof stateChange === 'function' ? selectorStore.getSelectorValue(stateChange) : stateChange;

    state.writeState(mergeToState);

    return mergeToState;
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
