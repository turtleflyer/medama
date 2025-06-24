import type { SubscriptionJob } from '../medama.types';

/**
 * A function to add a subscription job to the selector. Returns an unsubscribe
 * function. The timing and conditions for job invocation are determined by the
 * manageSubscriptions logic.
 */
type AddSubscription<V> = (subscriptionJob: SubscriptionJob<V>) => () => void;

/**
 * Calculates and returns the selector's value.
 *
 * @returns The current value of the selector
 */
export type CalculateValue<V> = () => V;

/**
 * The selector record returned by createSelectorRecord. Provides methods to
 * subscribe and to retrieve the current value (with memoization).
 */
export type SelectorRecord<V> = {
  /**
   * Adds a subscription job. Returns an unsubscribe function. The timing and
   * conditions for job invocation are determined by the manageSubscriptions
   * logic.
   */
  addSubscription: AddSubscription<V>;

  /**
   * Returns the current value of the selector, recalculating if necessary (with
   * memoization).
   */
  getValue: CalculateValue<V>;
};

/**
 * An object representing the trigger logic for the selector. Used by
 * manageSubscriptions to control when jobs should be run and whether the
 * selector should be added to a queue or similar structure as determined by
 * manageSubscriptions.
 */
export type SelectorTrigger = {
  /**
   * Triggers all subscription jobs with the current value. Also initiates
   * unregistration if the job set is empty, allowing for cleanup as determined
   * by the internal logic.
   */
  trigger: () => void;

  /**
   * Returns true if the selector should be added to a queue or similar
   * structure as determined by manageSubscriptions. Resets the internal flag
   * after being called.
   */
  isToAdd: () => boolean;
};

/**
 * A function to manage subscriptions for the selector. Receives the
 * immediateTask (to mark the selector as needing recalculation) and the
 * selectorTrigger (to control when jobs are run). Universal and pluggable; can
 * implement any logic for managing subscriptions, dependency graphs, etc.
 */
export type ManageSubscriptions = (
  immediateTask: () => void,
  selectorTrigger: SelectorTrigger
) => void;

/**
 * Universal factory function for creating a selector record with memoization
 * and subscription management.
 *
 * @param calculateValue - Pure function to calculate the selector value (no
 * memoization inside).
 * @param manageSubscriptions - Function to manage subscriptions, receives
 * immediateTask and selectorTrigger.
 * @param unsubscribe - Function to clean up when no subscriptions remain.
 * @returns SelectorRecord with addSubscription and getValue methods.
 */
export const createSelectorRecord = <V>(
  calculateValue: CalculateValue<V>,
  manageSubscriptions: ManageSubscriptions,
  unsubscribe: () => void
): SelectorRecord<V> => {
  let isRegistered = false;

  /**
   * Unregisters the selector's trigger and calls the provided unsubscribe
   * logic. Used for cleanup when no subscriptions remain.
   */
  const unregisterTrigger = (): void => {
    if (!isRegistered) return;

    unsubscribe();
    isRegistered = false;
  };

  /**
   * The result value for the selector is set to be calculated lazily,
   * preventing unnecessary recalculating. Memoized value is stored here.
   */
  let memValue: V;

  /**
   * Flag indicating if selector value needs recalculation. Set to true when
   * dependencies change, reset after recalculation. Used for lazy evaluation to
   * prevent unnecessary calculations.
   */
  let isToRecalculateValue = true;

  /**
   * Recalculates selector value only if needed. Updates memoized value and
   * resets recalculation flag. Lazy evaluation to prevent unnecessary
   * calculations.
   */
  const runSelectorWithMemoization = (): void => {
    if (!isToRecalculateValue) return;

    memValue = calculateValue();
    isToRecalculateValue = false;
  };

  /**
   * Internal flag for dependency graph management. Used by isToAdd method of
   * selectorTrigger.
   */
  let isToAddFlag = true;

  /**
   * Marks the selector as needing recalculation. It ensures that the selector
   * value will be recomputed the next time when it is accessed. Passed to
   * manageSubscriptions.
   */
  const immediateTask = () => {
    isToRecalculateValue = true;
  };

  /**
   * Set of all subscription jobs to be called when the trigger method is
   * invoked.
   */
  const jobs = new Set<SubscriptionJob<V>>();

  const selectorTrigger: SelectorTrigger = {
    trigger: (): void => {
      isToAddFlag = true;

      if (jobs.size === 0) {
        unregisterTrigger();

        return;
      }

      runSelectorWithMemoization();

      jobs.forEach((job): void => {
        job(memValue);
      });
    },

    isToAdd: (): boolean => {
      const toReturn = isToAddFlag;
      isToAddFlag = false;

      return toReturn;
    },
  };

  /**
   * Registers the selector's trigger with the provided manageSubscriptions
   * logic. Ensures registration happens only once.
   */
  const registerTrigger = (): void => {
    if (isRegistered) return;

    manageSubscriptions(immediateTask, selectorTrigger);
    isRegistered = true;
  };

  /**
   * Adds a subscription job to the jobs set. Returns an unsubscribe function.
   */
  const addSubscription: AddSubscription<V> = (subscriptionJob) => {
    jobs.add(subscriptionJob);

    return () => {
      jobs.delete(subscriptionJob);
    };
  };

  /**
   * Returns the current value of the selector, recalculating if necessary (with
   * memoization). Also ensures the trigger is registered.
   */
  const getValue: CalculateValue<V> = () => {
    runSelectorWithMemoization();
    registerTrigger();

    return memValue;
  };

  return { addSubscription, getValue };
};
