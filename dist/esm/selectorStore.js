import { compose, lazily } from 'alnico';
/**
 * The selector store manages the map of each selector to its record that is methods allowing to get
 * the most updated value and manage subscriptions. The map is a WeakMap that allow garbage
 * collecting if all references to the selector was gone.
 */
export const createSelectorStore = (registerSelectorTrigger) => {
  const { getSelectorValue, subscribeToStateInSelectorStore } = compose(
    {},
    {
      getSelectorValue: ({ getSelectorRecord }, selector) => {
        const { getValue } = getSelectorRecord(selector);
        return getValue();
      },
      subscribeToStateInSelectorStore: ({ getSelectorRecord }, selector, subscription) => {
        const { addSubscription, getValue } = getSelectorRecord(selector);
        const possibleSubscriptionJob = subscription(getValue());
        return addSubscription(
          possibleSubscriptionJob !== null && possibleSubscriptionJob !== void 0
            ? possibleSubscriptionJob
            : subscription
        );
      },
      getSelectorRecord: ({ selectorSubscriptionStore }, selector) => {
        var _a;
        const selectorRecord =
          (_a = selectorSubscriptionStore.get(selector)) !== null && _a !== void 0
            ? _a
            : createSelectorRecord(selector, registerSelectorTrigger);
        selectorSubscriptionStore.set(selector, selectorRecord);
        return selectorRecord;
      },
    },
    { selectorSubscriptionStore: new WeakMap() }
  );
  return { getSelectorValue, subscribeToStateInSelectorStore };
};
/**
 * A selector record manages adding subscriptions to the state changes along with the method of
 * getting the most recently updated calculation result for the selector. It designed in the way
 * preventing the unnecessary recalculating that.
 */
export const createSelectorRecord = (selector, registerSelectorTrigger) => {
  const { addSubscription, getValue } = compose(
    {
      /**
       * The result value for the selector is set to be calculated lazily preventing unnecessary
       * recalculating.
       */
      value: lazily(({ calculateValue }) => calculateValue()),
      /**
       * Indicates if the selector is currently registered.
       */
      registered: true,
    },
    {
      addSubscription({ jobs }, subscriptionJob) {
        jobs.add(subscriptionJob);
        return () => {
          jobs.delete(subscriptionJob);
        };
      },
      getValue: ({ value, registered, selectorTrigger }) => {
        /**
         * If on reading the selector value it appears that the selector is unregistered it gets
         * registered right away even if there are no jobs (it will be unregistered on the next
         * update of the selector's dependencies) to make sure the next reading will recalculate the
         * value only if it was updated.
         */
        if (!registered.get()) {
          registerSelectorTrigger(selectorTrigger);
          registered.set(true);
        }
        return value.get();
      },
      selectorTrigger: ({ jobs, value, registered, calculateValue }) => {
        /**
         * If the job list is empty it sends the states image the signal to remove the trigger.
         */
        if (jobs.size === 0) {
          value.set(lazily(({ calculateValue }) => calculateValue()));
          registered.set(false);
          return false;
        }
        const calculatedValue = calculateValue();
        value.set(calculatedValue);
        jobs.forEach((job) => {
          job(calculatedValue);
        });
        return true;
      },
    },
    Object.assign(
      { jobs: new Set() },
      lazily(({ selectorTrigger, registered }) => {
        const readState = registerSelectorTrigger(selectorTrigger);
        registered.set(true);
        return { calculateValue: () => readState(selector) };
      })
    )
  );
  return { addSubscription, getValue };
};
//# sourceMappingURL=selectorStore.js.map
