import { compose, lazily } from 'alnico';
import type {
  ReadState,
  Selector,
  Subscription,
  SubscriptionJob,
  UnsubscribeFromState,
} from './medama.types';
import type { RegisterSelectorTrigger, SelectorTrigger } from './state';

export type SubscribeToStateInSelectorStore<State extends object> = <V>(
  selector: Selector<State, V>,
  subscription: Subscription<V>
) => UnsubscribeFromState;

/**
 * The selector store manages the map of each selector to its record that is methods allowing to get
 * the most updated value and manage subscriptions. The map is a WeakMap that allow garbage
 * collecting if all references to the selector was gone.
 */
export const createSelectorStore = <State extends object>(
  registerSelectorTrigger: RegisterSelectorTrigger<State>
) => {
  const { getSelectorValue, subscribeToStateInSelectorStore } = compose<
    {},
    {
      getSelectorValue: ReadState<State>;
      subscribeToStateInSelectorStore: SubscribeToStateInSelectorStore<State>;
      getSelectorRecord: <V>(selector: Selector<State, V>) => SelectorRecord<V>;
    },
    {
      selectorSubscriptionStore: WeakMap<Selector<State, unknown>, SelectorRecord<unknown>>;
    }
  >(
    {},

    {
      getSelectorValue: ({ getSelectorRecord }, selector) => {
        const { getValue } = getSelectorRecord(selector);

        return getValue();
      },

      subscribeToStateInSelectorStore: ({ getSelectorRecord }, selector, subscription) => {
        const { addSubscription, getValue } = getSelectorRecord(selector);
        const possibleSubscriptionJob = subscription(getValue());

        return addSubscription(possibleSubscriptionJob ?? subscription);
      },

      getSelectorRecord: ({ selectorSubscriptionStore }, selector) => {
        const selectorRecord =
          selectorSubscriptionStore.get(selector) ??
          createSelectorRecord(selector, registerSelectorTrigger);

        selectorSubscriptionStore.set(selector, selectorRecord);

        return selectorRecord;
      },
    },

    { selectorSubscriptionStore: new WeakMap() }
  );

  return { getSelectorValue, subscribeToStateInSelectorStore };
};

type SelectorRecord<V> = {
  addSubscription: (subscriptionJob: SubscriptionJob<V>) => () => void;
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
  const { addSubscription, getValue } = compose<
    { value: V; registered: boolean },
    SelectorRecord<V> & {
      /**
       * A handler that gets triggered when some of selector's dependencies were updated. It is
       * passed to the `registerSelectorTrigger` from the state image when the selector is being
       * registered.
       */
      selectorTrigger: SelectorTrigger;
    },
    {
      /**
       * Jobs are getting run when the selector's dependencies change.
       */
      jobs: Set<SubscriptionJob<V>>;
      calculateValue: () => V;
    }
  >(
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

    {
      jobs: new Set(),

      ...lazily(({ selectorTrigger, registered }) => {
        const readState = registerSelectorTrigger(selectorTrigger);
        registered.set(true);

        return { calculateValue: () => readState(selector) };
      }),
    }
  );

  return { addSubscription, getValue };
};
