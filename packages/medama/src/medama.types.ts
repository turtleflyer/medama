import type { Normalize } from './type-helpers/Normalize';

/**
 * Function type for selecting data from state.
 * Takes entire state object and returns derived value.
 * Used for memoized reads and subscription tracking.
 * Dependencies are automatically tracked during execution.
 *
 * @template State The complete type of the state object to select from
 * @template V The type of the value derived from state
 */
export type Selector<State extends object, V = unknown> = (state: State) => V;

/**
 * Function type for handling selector value changes.
 * Called whenever selector's dependencies change.
 * Receives the newly calculated selector result.
 *
 * @template V The type of the selector result value being processed
 */
export type SubscriptionJob<V> = (selectorResult: V) => void;

/**
 * Function type for subscription handling with two possible patterns:
 * 1. Direct subscription job - processes value changes immediately
 *    during subscription setup and on each change
 * 2. Factory function - runs when selector calculates initial value,
 *    returns subscription job for subsequent updates that will always
 *    force value recalculation
 *
 * @template V The type of the value being subscribed to
 */
export type Subscription<V> = SubscriptionJob<V> | ((selectorResult: V) => SubscriptionJob<V>);

/**
 * Function to remove subscription and clean up associated resources.
 * Stops subscription from receiving further updates.
 * Removes internal subscription tracking.
 */
export type UnsubscribeFromState = () => void;

/**
 * Function to update existing subscription with new subscription function.
 * Works with both subscription patterns like initial subscription.
 * Runs subscription function during new subscription establishment.
 *
 * @template V The type of the value being subscribed to
 */
export type Resubscribe<V> = (subscription: Subscription<V>) => void;

/**
 * Function to transfer existing subscription to a new selector.
 * Always runs the subscription job with the new selector's result.
 * Never re-runs the initialization part if original was a factory function.
 *
 * @template State The type of the state object being subscribed to
 * @template V The type of the value being subscribed to
 * @param newSelector - The new selector to use for state observation
 */
export type TransferSubscription<State extends object, V> = (
  newSelector: Selector<State, V>
) => void;

/**
 * Methods returned when creating a subscription.
 * Allows managing subscription lifecycle through unsubscribe, resubscribe and transfer operations.
 *
 * @template State The type of the state object being subscribed to
 * @template V The type of the value being subscribed to
 */
export type SubscriptionMethods<State extends object, V> = {
  /**
   * Removes the subscription and cleans up associated resources.
   * Stops the subscription from receiving further updates.
   */
  unsubscribe: UnsubscribeFromState;

  /**
   * Updates existing subscription with a new subscription function.
   * Works with both direct subscription jobs and factory functions.
   * Runs the subscription function during new subscription setup.
   */
  resubscribe: Resubscribe<V>;

  /**
   * Transfers subscription to a new selector while keeping the same subscription job.
   * Always runs the job with new selector result but never re-runs initialization.
   */
  transfer: TransferSubscription<State, V>;
};

/**
 * Function to create subscription for selector value changes.
 * Runs subscription function during initial setup.
 * Returns methods to manage subscription lifecycle.
 *
 * @template State The type of the state object being subscribed to
 * @template V The type of the selected value to subscribe to
 */
export type SubscribeToState<State extends object> = <V>(
  selector: Selector<State, V>,
  subscription: Subscription<V>
) => SubscriptionMethods<State, V>;

/**
 * Function to read current value from state using selector.
 * Returns memoized result if dependencies haven't changed.
 *
 * @template State The type of the state object to read from
 * @template V The type of the value to be read
 */
export type ReadState<State extends object> = <V>(selector: Selector<State, V>) => V;

/**
 * Function to create partial state update from current state.
 * Used in setState to generate state changes based on current values.
 * Provides type-safe access to current state.
 *
 * @template State The type of the complete state object
 * @template SChange The type of partial state changes to return
 */
export type Setter<State extends object, SChange extends Partial<State>> = (
  state: State
) => SChange;

/**
 * Function to update state with partial changes.
 * Accepts either direct state changes or setter function.
 * Ensures type safety of state updates.
 *
 * @template State The type of the complete state object
 * @template SChange The type of partial state changes
 */
export type SetState<State extends object> = <SChange extends Partial<State>>(
  stateChange: SChange | Setter<State, SChange>
) => SChange;

/**
 * Function to reset state to initial values.
 * Optionally accepts new initial state object.
 * Useful for testing and state reset scenarios.
 *
 * @template State The type of the state object to reset
 */
export type ResetState<State extends object> = (initState?: Partial<State>) => void;

/**
 * Core interface for interacting with medama state.
 * Provides methods for reading, updating, and subscribing to state.
 * Used for building library extensions and enabling state communications
 * between different parts of application.
 *
 * @template State The type of the state object managed by this pupil
 */
export type Pupil<State extends object> = {
  /**
   * Function to create subscription for selector value changes.
   * Runs subscription function during initial setup.
   * Returns methods to manage subscription lifecycle.
   */
  subscribeToState: SubscribeToState<State>;

  /**
   * Function to read current value from state using selector.
   * Returns memoized result if dependencies haven't changed.
   */
  readState: ReadState<State>;

  /**
   * Function to update state with partial changes.
   * Accepts either direct state changes or setter function.
   * Ensures type safety of state updates.
   */
  setState: SetState<State>;

  /**
   * Function to reset state to initial values.
   * Optionally accepts new initial state object.
   * Useful for testing and state reset scenarios.
   */
  resetState: ResetState<State>;
};

/**
 * Extended interface combining state management methods with pupil reference.
 * While Pupil type is used for building library extensions and state
 * communications, Medama serves as a complete set of state management tools
 * that are initialized on demand.
 *
 * @template State The type of the state object managed by this medama instance
 */
export type Medama<State extends object> = Pupil<State> & {
  /**
   * Core interface for interacting with medama state.
   * Provides methods for reading, updating, and subscribing to state.
   * Used for building library extensions and enabling state communications
   * between different parts of application.
   */
  pupil: Pupil<State>;
};

/**
 * Factory function type for creating medama instances.
 * Supports both complete and partial initial state.
 * Returns normalized medama instance with pupil reference.
 *
 * @template State The type of the state object to be managed
 */
export type CreateMedama = {
  <State extends object>(initState: State): Normalize<Medama<State>>;
  <State extends object>(initState?: Partial<State>): Normalize<Medama<State>>;
};
