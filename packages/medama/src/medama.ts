import type {
  CreateMedama,
  ReadState,
  ResetState,
  Selector,
  SetState,
  SubscribeToState,
  Subscription,
  SubscriptionMethods,
} from './medama.types';
import { createSelectorStore } from './selectorStore';
import { createStateImage } from './state';

export const createMedama: CreateMedama = <State extends object>(initState?: Partial<State>) => {
  let state = createStateImage(initState);
  let selectorStore = createSelectorStore(state.runOverState);

  /**
   * Flag to prevent state updates during subscription setup. True while
   * subscription is being configured. Used to throw error if state update is
   * attempted during subscription.
   */
  let flagSubscriptionInProgress = false;

  /**
   * Flag to prevent recursive state updates from subscription jobs. True while
   * state update is in progress. Used to throw error if subscription job
   * attempts state update.
   */
  let flagStateUpdating = false;

  /**
   * Resets state management flags to their initial values. Called during error
   * handling to ensure clean state after:
   * - Failed subscription setup
   * - Failed state updates
   * - Failed state reads
   */
  const resetInit = (): void => {
    flagSubscriptionInProgress = false;
    flagStateUpdating = false;
  };

  const subscribeToState: SubscribeToState<State> = <V>(
    selector: Selector<State, V>,
    subscription: Subscription<V>
  ): SubscriptionMethods<V> => {
    try {
      flagSubscriptionInProgress = true;

      return (
        [
          selectorStore.subscribeToStateInSelectorStore(selector, subscription),
          (flagSubscriptionInProgress = false),
        ] as const
      )[0];
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

      return ([state.setState(stateChange), (flagStateUpdating = false)] as const)[0];
    } catch (e) {
      resetInit();

      throw e;
    }
  };

  const resetState: ResetState<State> = (initState) => {
    const newState = createStateImage(initState);
    const newSelectorStore = createSelectorStore(newState.runOverState);
    state = newState;
    selectorStore = newSelectorStore;
    resetInit();
  };

  const pupil = { subscribeToState, resetState, setState, readState };

  return { ...pupil, pupil };
};
