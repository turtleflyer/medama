import type { Selector, Subscription, SubscriptionJob } from './medama.types';
import type { RegisterSelectorTrigger } from './state';
/**
 * The selector store manages the map of each selector to its record that is methods allowing to get
 * the most updated value and manage subscriptions. The map is a WeakMap that allow garbage
 * collecting if all references to the selector was gone.
 */
export declare const createSelectorStore: <State extends object>(
  registerSelectorTrigger: RegisterSelectorTrigger<State>
) => {
  getSelectorValue: {
    <V>(selector: Selector<State, V>): V;
    (selector: Selector<State, unknown>): unknown;
  };
  subscribeToStateInSelectorStore: <V>(
    selector: Selector<State, V>,
    subscription: Subscription<V>
  ) => () => void;
};
type AddSubscription<V> = (subscriptionJob: SubscriptionJob<V>) => () => void;
/**
 * A selector record manages adding subscriptions to the state changes along with the method of
 * getting the most recently updated calculation result for the selector. It designed in the way
 * preventing the unnecessary recalculating that.
 */
export declare const createSelectorRecord: <State extends object, V>(
  selector: Selector<State, V>,
  registerSelectorTrigger: RegisterSelectorTrigger<State>
) => {
  addSubscription: AddSubscription<V>;
  getValue: () => V;
};
export {};
