import type { Selector, Subscription, SubscriptionJob } from './medama.types';
import type { StateImage } from './state';

/**
 * The class manages the map of each selector to its record that is methods allowing to get the most
 * updated value and manage subscriptions. The map is a WeakMap that allow garbage collecting if all
 * references to the selector was gone.
 */
export class SelectorStore<State extends object> {
  constructor(stateImage: StateImage<State>) {
    this.getSelectorRecord = (selector: Selector<State, unknown>) => {
      const selectorRecord =
        this.selectorSubscriptionStore.get(selector) ?? new SelectorRecord(selector, stateImage);

      this.selectorSubscriptionStore.set(selector, selectorRecord);

      return selectorRecord;
    };
  }

  private readonly selectorSubscriptionStore = new WeakMap<
    Selector<State, unknown>,
    SelectorRecord<State, unknown>
  >();

  getSelectorValue<V>(selector: Selector<State, V>) {
    return this.getSelectorRecord(selector).getValue();
  }

  subscribeToStateInSelectorStore<V>(selector: Selector<State, V>, subscription: Subscription<V>) {
    const selectorRecord = this.getSelectorRecord(selector);
    const possibleSubscriptionJob = subscription(selectorRecord.getValue());

    return selectorRecord.addSubscription(possibleSubscriptionJob ?? subscription);
  }

  private getSelectorRecord: {
    <V>(selector: Selector<State, V>): SelectorRecord<State, V>;
    (selector: Selector<State, unknown>): SelectorRecord<State, unknown>;
  };
}

/**
 * The class manages adding subscriptions to the state changes along with the method of getting the
 * most recently updated calculation result for the selector. It designed in the way preventing the
 * unnecessary recalculating that.
 */
export class SelectorRecord<State extends object, V> {
  constructor(selector: Selector<State, V>, stateImage: StateImage<State>) {
    const selectorTrigger = () => {
      /**
       * If the job list is empty it sends the states image the signal to remove the trigger.
       */
      if (this.jobs.size === 0) {
        this.toRecalculateValue = true;
        this.registered = false;

        return false;
      }

      this.value = this.calculateValue();

      this.jobs.forEach((job) => {
        job(this.value);
      });

      return true;
    };

    const readState = stateImage.registerSelectorTrigger(selectorTrigger);
    this.calculateValue = () => readState(selector);

    this.getValue = () => {
      /**
       * If on reading the selector value it appears that the selector is unregistered it gets
       * registered right away even if there are no jobs (it will be unregistered on the next
       * update of the selector's dependencies) to make sure the next reading will recalculate the
       * value only if it was updated.
       */
      if (!this.registered) {
        stateImage.registerSelectorTrigger(selectorTrigger);
        this.registered = true;
      }

      this.value = this.toRecalculateValue ? this.calculateValue() : this.value;
      this.toRecalculateValue = false;

      return this.value;
    };
  }

  /**
   * The result value for the selector is set to be calculated lazily preventing unnecessary
   * recalculating.
   */
  private value = null as V;
  private toRecalculateValue = true;

  /**
   * Indicates if the selector is currently registered.
   */
  private registered = true;

  /**
   * Jobs are getting run when the selector's dependencies change.
   */
  private readonly jobs = new Set<SubscriptionJob<V>>();
  private calculateValue: () => V;

  addSubscription(subscriptionJob: SubscriptionJob<V>) {
    this.jobs.add(subscriptionJob);

    return () => {
      this.jobs.delete(subscriptionJob);
    };
  }

  getValue: () => V;
}
