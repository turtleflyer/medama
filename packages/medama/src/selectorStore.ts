import type {
  Resubscribe,
  Selector,
  Subscription,
  SubscriptionJob,
  SubscriptionMethods,
  TransferSubscription,
  UnsubscribeFromState,
} from './medama.types';
import type { KeyHandle, KeyHandleCollector, RunOverState } from './state';

type GetSelectorValue<State extends object> = <V>(selector: Selector<State, V>) => V;

type SubscribeToStateInSelectorStore<State extends object> = <V>(
  selector: Selector<State, V>,
  subscription: Subscription<V>
) => SubscriptionMethods<State, V>;

/**
 * Creates a store to manage selectors and their associated records. Each
 * selector is mapped to methods for:
 * - Getting most recently calculated value
 * - Managing subscriptions to value changes
 *
 * Uses WeakMap internally to allow garbage collection when selectors are no
 * longer referenced.
 *
 * @param runOverState Function to run selector over current state
 * @returns Methods for getting selector values and managing subscriptions
 */
export const createSelectorStore = <State extends object>(
  runOverState: RunOverState<State, unknown>
): {
  getSelectorValue: GetSelectorValue<State>;
  subscribeToStateInSelectorStore: SubscribeToStateInSelectorStore<State>;
} => {
  const selectorSubscriptionStore = new WeakMap<
    Selector<State, unknown>,
    SelectorRecord<unknown>
  >();

  /**
   * Gets or creates a record for given selector from WeakMap store. Record
   * contains methods to:
   * - Get memoized selector value
   * - Add subscription to selector value changes
   *
   * @param selector Selector to get/create record for
   * @returns Record containing selector's value and subscription management
   * methods
   */
  const getSelectorRecord = <V>(selector: Selector<State, V>): SelectorRecord<V> => {
    const selectorRecord =
      (selectorSubscriptionStore.get(selector) as SelectorRecord<V>) ??
      createSelectorRecord(selector, runOverState);

    selectorSubscriptionStore.set(selector, selectorRecord);

    return selectorRecord;
  };

  /**
   * Gets current value for given selector. Retrieves or creates selector record
   * from store and returns its memoized value. Value is recalculated only if
   * selector's dependencies have changed.
   *
   * @param selector Selector to get value for
   * @returns Current value for selector
   */
  const getSelectorValue: GetSelectorValue<State> = (selector) => {
    const { getValue } = getSelectorRecord(selector);

    return getValue();
  };

  /**
   * Creates subscription to selector value changes.
   * - Gets or creates selector record from store
   * - Evaluates initial subscription with current value
   * - Sets up subscription job for future value changes
   * - Returns methods to unsubscribe or resubscribe with new subscription
   *
   * @param selector Selector to subscribe to
   * @param subscription Subscription function to run on value changes
   * @returns Object with unsubscribe and resubscribe methods
   */
  const subscribeToStateInSelectorStore: SubscribeToStateInSelectorStore<State> = <V>(
    selector: Selector<State, V>,
    subscription: Subscription<V>
  ): SubscriptionMethods<State, V> => {
    let currentSelector = selector;
    let unsubscribeHandle: UnsubscribeFromState | null = null;
    let currentRevealedSubscriptionJob: SubscriptionJob<V>;

    const evaluateAndSubscribe = (subscriptionToReveal: Subscription<V>): void => {
      const { addSubscription, getValue } = getSelectorRecord(currentSelector);
      const possibleSubscriptionJob = subscriptionToReveal(getValue());

      currentRevealedSubscriptionJob =
        typeof possibleSubscriptionJob === 'function'
          ? possibleSubscriptionJob
          : subscriptionToReveal;

      unsubscribeHandle = addSubscription(currentRevealedSubscriptionJob);
    };

    evaluateAndSubscribe(subscription);

    const unsubscribe: UnsubscribeFromState = () => {
      unsubscribeHandle?.();
      unsubscribeHandle = null;
    };

    const resubscribe: Resubscribe<V> = (subscriptionToResubscribe) => {
      unsubscribe();
      evaluateAndSubscribe(subscriptionToResubscribe);
    };

    const transfer: TransferSubscription<State, V> = (selectorToTransferTo) => {
      unsubscribe();
      currentSelector = selectorToTransferTo;
      evaluateAndSubscribe(currentRevealedSubscriptionJob);
    };

    return { unsubscribe, resubscribe, transfer };
  };

  return { getSelectorValue, subscribeToStateInSelectorStore };
};

type AddSubscription<V> = (subscriptionJob: SubscriptionJob<V>) => () => void;

type GetValue<V> = () => V;

type SelectorRecord<V> = { addSubscription: AddSubscription<V>; getValue: GetValue<V> };

/**
 * Creates a record to manage selector value calculation and subscriptions.
 * Handles:
 * - Lazy calculation of selector value with memoization
 * - Collection and registration of state key dependencies
 * - Subscription management for state changes
 * - Automatic cleanup by unregistering from state key notifications when no
 *   active subscriptions remain, reducing overhead for unused selectors
 *
 * @param selector Selector function to create record for
 * @param runOverState Function to execute selector over current state
 * @returns Record with methods for value retrieval and subscription management
 */
export const createSelectorRecord = <State extends object, V>(
  selector: Selector<State, V>,
  runOverState: RunOverState<State, V>
): SelectorRecord<V> => {
  /**
   * Stores cleanup functions returned by key handles during initial
   * registration. Used to remove selector trigger from state property
   * dependencies when needed. Called during unregistration to clean up all
   * dependency subscriptions.
   */
  const unregisterTriggerHandleCallbacks = new Set<() => void>();

  /**
   * Indicates if the selector is currently registered.
   */
  let isRegistered = false;

  /**
   * Unregisters the selector's trigger from all its dependency key handles.
   * - Calls all stored cleanup callbacks to remove the selector's trigger from state property dependencies.
   * - Ensures this operation only runs if the selector is currently registered.
   * - Marks the selector as unregistered to prevent duplicate cleanup.
   *
   * This is used for automatic cleanup when a selector is no longer needed (e.g., no active subscriptions remain),
   * helping to avoid memory leaks and unnecessary notifications.
   */
  const unregisterTrigger = (): void => {
    if (!isRegistered) return;

    unregisterTriggerHandleCallbacks.forEach((callback) => {
      callback();
    });

    isRegistered = false;
  };

  /**
   * Stores key handles collected during initial selector execution. Each handle
   * represents a state property dependency. Used to register/unregister
   * selector trigger when these dependencies change. Maintained throughout
   * selector's lifecycle for reregistration.
   */
  const collectedKeyHandles = new Set<KeyHandle>();

  /**
   * Collects key handles during initial selector execution. Each handle
   * represents state property that selector depends on. Added handles are used
   * to register/unregister selector trigger when dependencies change.
   */
  const keyHandleCollector: KeyHandleCollector = (keyHandle) => {
    collectedKeyHandles.add(keyHandle);
  };

  /**
   * The result value for the selector is set to be calculated lazily preventing
   * unnecessary recalculating.
   */
  let memValue: V;

  /**
   * Flag indicating if selector value needs recalculation. Set to true when
   * dependencies change, reset after recalculation. Used for lazy evaluation to
   * prevent unnecessary calculations.
   */
  let isToRecalculateValue = false;

  /**
   * Recalculates selector value only if dependencies have changed. Updates
   * memoized value and resets recalculation flag. Lazy evaluation to prevent
   * unnecessary calculations.
   */
  const runSelectorWithMemoization = (): void => {
    if (isToRecalculateValue) {
      memValue = runOverState(selector);
      isToRecalculateValue = false;
    }
  };

  /**
   * Marks the selector as needing recalculation.
   * This is called when a dependency property changes, ensuring that the selector value
   * will be recomputed the next time it is accessed or when a trigger fires.
   */
  const immediateTask = () => {
    isToRecalculateValue = true;
  };

  /**
   * Collection of subscription jobs that run when selector's dependencies
   * change. When empty, triggers cleanup by unregistering selector from state
   * updates.
   */
  const jobs = new Set<SubscriptionJob<V>>();

  /**
   * Triggered when selector's dependencies change. Handles:
   * - If there are no active jobs (subscriptions), and the selector is registered and marked for recalculation,
   *   unregisters the selector's trigger from all dependencies (cleanup).
   * - If there are active jobs, recalculates the selector value if needed, and notifies all jobs with the new value.
   */
  const selectorTrigger = (): void => {
    if (jobs.size === 0) {
      // If no subscriptions remain, unregister the selector's trigger for cleanup
      unregisterTrigger();

      return;
    }

    runSelectorWithMemoization();

    jobs.forEach((job): void => {
      job(memValue);
    });
  };

  /**
   * Registers the selector's trigger with all its dependency key handles.
   * - On initial registration (isToPopulateUnregisterCallbacks = true), stores cleanup callbacks for later unregistration.
   * - Prevents duplicate registrations using the isRegistered flag.
   *
   * @param isToPopulateUnregisterCallbacks Whether to store cleanup callbacks for unregistering later
   */
  const registerTrigger = (isToPopulateUnregisterCallbacks = false): void => {
    if (isRegistered) return;

    collectedKeyHandles.forEach((handle) => {
      const callback = handle(immediateTask, selectorTrigger);

      isToPopulateUnregisterCallbacks && unregisterTriggerHandleCallbacks.add(callback);
    });

    isRegistered = true;
  };

  /**
   * Adds subscription job to run when selector value changes. Jobs are stored
   * in Set to ensure uniqueness. Returns cleanup function to remove
   * subscription.
   *
   * @param subscriptionJob Function to run when selector value changes
   * @returns Cleanup function to remove subscription
   */
  const addSubscription: AddSubscription<V> = (subscriptionJob) => {
    jobs.add(subscriptionJob);

    return () => {
      jobs.delete(subscriptionJob);
    };
  };

  /**
   * Gets memoized selector value, recalculating only if dependencies changed.
   * Registers selector even without active subscriptions to ensure proper value
   * tracking. Unregistration happens on next dependency update if no
   * subscriptions exist.
   */
  const getValue: GetValue<V> = () => {
    runSelectorWithMemoization();
    registerTrigger();

    return memValue;
  };

  memValue = runOverState(selector, keyHandleCollector);
  registerTrigger(true);

  return { addSubscription, getValue };
};
