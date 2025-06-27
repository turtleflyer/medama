import type {
  CreateMedama,
  Medama,
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

/**
 * Factory function type for creating medama instances. Supports both complete
 * and partial initial state. Returns normalized medama instance with pupil
 * reference.
 */
export const createMedama: CreateMedama = <State extends object>(initState?: Partial<State>) => {
  let state = createStateImage(initState);
  let selectorStore = createSelectorStore(state.runOverState);

  /**
   * Resets the job queue to a clean state. Called during error handling when
   * state updates fail, since failed updates may leave the queue in an
   * unhealthy state.
   */
  const resetInit = (): void => {
    state.resetQueue();
  };

  const subscribeToState: SubscribeToState<State> = <V>(
    selector: Selector<State, V>,
    subscription: Subscription<V>
  ): SubscriptionMethods<State, V> => {
    try {
      return selectorStore.subscribeToStateInSelectorStore(selector, subscription);
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
      return state.setState(stateChange);
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

  const pupil = { subscribeToState, resetState, setState, readState } as Medama<State>;

  return Object.assign(pupil, { pupil });
};
