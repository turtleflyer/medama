import type { Selector, Subscription, SubscriptionJob } from './medama.types';
import type { StateImage } from './state';
/**
 * The class manages the map of each selector to its record that is methods allowing to get the most
 * updated value and manage subscriptions. The map is a WeakMap that allow garbage collecting if all
 * references to the selector was gone.
 */
export declare class SelectorStore<State extends object> {
  constructor(stateImage: StateImage<State>);
  private readonly selectorSubscriptionStore;
  getSelectorValue<V>(selector: Selector<State, V>): V;
  subscribeToStateInSelectorStore<V>(
    selector: Selector<State, V>,
    subscription: Subscription<V>
  ): () => void;
  private getSelectorRecord;
}
/**
 * The class manages adding subscriptions to the state changes along with the method of getting the
 * most recently updated calculation result for the selector. It designed in the way preventing the
 * unnecessary recalculating that.
 */
export declare class SelectorRecord<State extends object, V> {
  constructor(selector: Selector<State, V>, stateImage: StateImage<State>);
  /**
   * The result value for the selector is set to be calculated lazily preventing unnecessary
   * recalculating.
   */
  private value;
  private toRecalculateValue;
  /**
   * Indicates if the selector is currently registered.
   */
  private registered;
  /**
   * Jobs are getting run when the selector's dependencies change.
   */
  private readonly jobs;
  private calculateValue;
  addSubscription(subscriptionJob: SubscriptionJob<V>): () => void;
  getValue: () => V;
}
