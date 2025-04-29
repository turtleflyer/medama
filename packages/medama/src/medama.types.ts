import type { Normalize } from './type-helpers/Normalize';

/**
 * Function type for selecting data from state. Takes entire state object and
 * returns derived value. Used for memoized reads and subscription tracking.
 *
 * @template State The type of the state object
 * @template V The type of the derived value
 */
export type Selector<State extends object, V = unknown> = (state: State) => V;

/**
 * Function type for handling selector value changes. Receives the updated
 * selector result as argument. Called when selector dependencies change to
 * process new value.
 *
 * @template V The type of the selector result value
 */
export type SubscriptionJob<V> = (selectorResult: V) => void;

/**
 * Function type for subscription handling, allows two patterns:
 * - Direct subscription job that processes selector value changes (runs
 *   immediately during subscription setup)
 * - Factory function that returns subscription job (runs during setup but
 *   allows skipping initial job execution)
 *
 * @template V The type of the selector result value
 */
export type Subscription<V> = SubscriptionJob<V> | ((selectorResult: V) => SubscriptionJob<V>);

/**
 * Function to update subscription with new function. Runs subscription function
 * during new subscription setup.
 *
 * @template V The type of the selector result value
 */
export type Resubscribe<V> = (subscription: Subscription<V>) => void;

/**
 * Function to remove subscription and clean up associated resources.
 */
export type UnsubscribeFromState = () => void;

/**
 * Methods returned when creating a subscription. Allows managing subscription
 * lifecycle through unsubscribe/resubscribe.
 *
 * @template V The type of the selector result value
 */
export type SubscriptionMethods<V> = {
  unsubscribe: UnsubscribeFromState;
  resubscribe: Resubscribe<V>;
};

/**
 * Function to create subscription for selector value changes. Runs subscription
 * function during setup. Returns methods to manage subscription lifecycle.
 *
 * @template State The type of the state object
 * @template V The type of the selector result value
 */
export type SubscribeToState<State extends object> = <V>(
  selector: Selector<State, V>,
  subscription: Subscription<V>
) => SubscriptionMethods<V>;

/**
 * Function to read current value from state using selector. Returns memoized
 * result if dependencies haven't changed.
 *
 * @template State The type of the state object
 * @template V The type of the selector result value
 */
export type ReadState<State extends object> = <V>(selector: Selector<State, V>) => V;

/**
 * Function to create partial state update from current state. Used in setState
 * to generate state changes.
 *
 * @template State The type of the state object
 * @template SChange The type of partial state changes
 */
export type Setter<State extends object, SChange extends Partial<State>> = (
  state: State
) => SChange;

/**
 * Function to update state with partial changes. Accepts either state change
 * object or setter function.
 *
 * @template State The type of the state object
 * @template SChange The type of partial state changes
 */
export type SetState<State extends object> = <SChange extends Partial<State>>(
  stateChange: SChange | Setter<State, SChange>
) => SChange;

/**
 * Function to reset state to initial values. Optionally accepts new initial
 * state.
 *
 * @template State The type of the state object
 */
export type ResetState<State extends object> = (initState?: Partial<State>) => void;

/**
 * Core interface for interacting with medama state. Provides methods for
 * reading, updating, and subscribing to state. Designed for library extension -
 * meant to be consumed by libraries built on top of medama to extend its
 * functionality.
 *
 * @template State The type of the state object
 */
export type Pupil<State extends object> = {
  subscribeToState: SubscribeToState<State>;
  readState: ReadState<State>;
  setState: SetState<State>;
  resetState: ResetState<State>;
};

/**
 * Extended interface that includes pupil reference. Provides both direct
 * methods and pupil instance.
 *
 * @template State The type of the state object
 */
export type Medama<State extends object> = Pupil<State> & {
  pupil: Pupil<State>;
};

/**
 * Factory function type for creating medama instances. Supports both complete
 * and partial initial state.
 *
 * @template State The type of the state object
 */
export type CreateMedama = {
  <State extends object>(initState: State): Normalize<Medama<State>>;

  <State extends object>(initState?: Partial<State>): Normalize<Medama<State>>;
};
