import type { Selector, Subscription, SubscriptionJob } from './medama.types';
import type { RegisterSelectorTrigger } from './state';

/**
 * The selector store manages the map of each selector to its record that is methods allowing to get
 * the most updated value and manage subscriptions. The map is a WeakMap that allow garbage
 * collecting if all references to the selector was gone.
 */
export const createSelectorStore = <State extends object>(
  registerSelectorTrigger: RegisterSelectorTrigger<State>
) => {
  const selectorSubscriptionStore = new WeakMap<
    Selector<State, unknown>,
    SelectorRecord<unknown>
  >();

  const getSelectorRecord = <V>(selector: Selector<State, V>) => {
    const selectorRecord =
      (selectorSubscriptionStore.get(selector) as SelectorRecord<V>) ??
      createSelectorRecord(selector, registerSelectorTrigger);

    selectorSubscriptionStore.set(selector, selectorRecord);

    return selectorRecord;
  };

  const getSelectorValue = <V>(selector: Selector<State, V>) => {
    const { getValue } = getSelectorRecord(selector);

    return getValue();
  };

  const subscribeToStateInSelectorStore = <V>(
    selector: Selector<State, V>,
    subscription: Subscription<V>
  ) => {
    const { addSubscription, getValue } = getSelectorRecord<V>(selector);
    const possibleSubscriptionJob = subscription(getValue());

    return addSubscription(possibleSubscriptionJob ?? subscription);
  };

  return { getSelectorValue, subscribeToStateInSelectorStore };
};

type AddSubscription<V> = (subscriptionJob: SubscriptionJob<V>) => () => void;

type SelectorRecord<V> = {
  addSubscription: AddSubscription<V>;
  getValue: () => V;
};

/**
 * A selector record manages adding subscriptions to the state changes along with the method of
 * getting the most recently updated calculation result for the selector. It designed in the way
 * preventing the unnecessary recalculating that.
 */
export const createSelectorRecord = <State extends object, V>(
  selector: Selector<State, V>,
  registerSelectorTrigger: RegisterSelectorTrigger<State>
) => {
  /**
   * The result value for the selector is set to be calculated lazily preventing unnecessary
   * recalculating.
   */
  let value: V;
  let toRecalculateValue = true;

  /**
   * Indicates if the selector is currently registered.
   */
  let registered = true;

  /**
   * Jobs are getting run when the selector's dependencies change.
   */
  const jobs = new Set<SubscriptionJob<V>>();
  const calculateValue = () => readState(selector);

  const addSubscription: AddSubscription<V> = (subscriptionJob) => {
    jobs.add(subscriptionJob);

    return () => {
      jobs.delete(subscriptionJob);
    };
  };

  const getValue = () => {
    /**
     * If on reading the selector value it appears that the selector is unregistered it gets
     * registered right away even if there are no jobs (it will be unregistered on the next
     * update of the selector's dependencies) to make sure the next reading will recalculate the
     * value only if it was updated.
     */
    if (!registered) {
      registerSelectorTrigger(selectorTrigger);
      registered = true;
    }

    toRecalculateValue && (value = calculateValue());
    toRecalculateValue = false;

    return value;
  };

  /**
   * A handler that gets triggered when some of selector's dependencies were updated. It is
   * passed to the `registerSelectorTrigger` from the state image when the selector is being
   * registered.
   */
  const selectorTrigger = () => {
    /**
     * If the job list is empty it sends the states image the signal to remove the trigger.
     */
    if (jobs.size === 0) {
      toRecalculateValue = true;
      registered = false;

      return false;
    }

    value = calculateValue();

    jobs.forEach((job) => {
      job(value);
    });

    return true;
  };

  const readState = registerSelectorTrigger(selectorTrigger);

  return { addSubscription, getValue };
};
