import type {
  ReadState,
  Selector,
  Subscription,
  SubscriptionJob,
  UnsubscribeFromState,
} from './medama.types';
import type { RegisterSelectorTrigger } from './state';
export type SubscribeToStateInSelectorStore<State extends object> = <V>(
  selector: Selector<State, V>,
  subscription: Subscription<V>
) => UnsubscribeFromState;
/**
 * The selector store manages the map of each selector to its record that is methods allowing to get
 * the most updated value and manage subscriptions. The map is a WeakMap that allow garbage
 * collecting if all references to the selector was gone.
 */
export declare const createSelectorStore: <State extends object>(
  registerSelectorTrigger: RegisterSelectorTrigger<State>
) => {
  getSelectorValue: ReadState<State>;
  subscribeToStateInSelectorStore: SubscribeToStateInSelectorStore<State>;
};
/**
 * A selector record manages adding subscriptions to the state changes along with the method of
 * getting the most recently updated calculation result for the selector. It designed in the way
 * preventing the unnecessary recalculating that.
 */
export declare const createSelectorRecord: <State extends object, V>(
  selector: Selector<State, V>,
  registerSelectorTrigger: RegisterSelectorTrigger<State>
) => {
  addSubscription: (subscriptionJob: SubscriptionJob<V>) => () => void;
  getValue: () => V;
};
