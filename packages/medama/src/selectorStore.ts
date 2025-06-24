import type {
  Resubscribe,
  Selector,
  Subscription,
  SubscriptionJob,
  SubscriptionMethods,
  TransferSubscription,
  UnsubscribeFromState,
} from './medama.types';
import {
  createSelectorRecord,
  type CalculateValue,
  type ManageSubscriptions,
  type SelectorRecord,
  type SelectorTrigger,
} from './queue-and-selector-management';
import type { KeyHandle, KeyHandleCollector, RunOverState } from './state';

/**
 * Gets current value for given selector. Retrieves or creates selector record
 * from store and returns its memoized value. Value is recalculated only if
 * selector's dependencies have changed.
 *
 * @param selector Selector to get value for
 * @returns Current value for selector
 */
type GetSelectorValue<State extends object> = <V>(selector: Selector<State, V>) => V;

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
  runOverState: RunOverState<State>
): {
  getSelectorValue: GetSelectorValue<State>;
  subscribeToStateInSelectorStore: SubscribeToStateInSelectorStore<State>;
} => {
  const selectorSubscriptionStore = new WeakMap<
    Selector<State, unknown>,
    SelectorRecord<unknown>
  >();

  /**
   * Gets or creates a record for given selector from WeakMap store.
   *
   * @param selector Selector to get/create record for
   * @returns Record containing selector's value and subscription management
   * methods
   */
  const getSelectorRecord = <V>(selector: Selector<State, V>): SelectorRecord<V> => {
    let selectorRecord: SelectorRecord<V>;

    if (!selectorSubscriptionStore.has(selector)) {
      const { calculateValue, manageSubscriptions, unsubscribe } =
        createSubscriptionManagementForSelector(selector, runOverState);

      selectorRecord = createSelectorRecord(calculateValue, manageSubscriptions, unsubscribe);
      selectorSubscriptionStore.set(selector, selectorRecord);
    } else {
      selectorRecord = selectorSubscriptionStore.get(selector) as SelectorRecord<V>;
    }

    return selectorRecord;
  };

  const getSelectorValue: GetSelectorValue<State> = (selector) => {
    const { getValue } = getSelectorRecord(selector);

    return getValue();
  };

  const subscribeToStateInSelectorStore: SubscribeToStateInSelectorStore<State> = <V>(
    selector: Selector<State, V>,
    subscription: Subscription<V>
  ) => {
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

/**
 * Methods for managing a selector's value calculation, subscription management,
 * and cleanup. Used as the return type for
 * createSubscriptionManagementForSelector.
 */
type SubscriptionManagementMethods<V> = {
  /**
   * Function to calculate the selector's value.
   */
  calculateValue: CalculateValue<V>;

  /**
   * Function to manage subscriptions for the selector. Receives immediateTask
   * (to mark the selector as needing recalculation) and selectorTrigger (to
   * control when jobs are run). Responsible for wiring up and managing the
   * subscription lifecycle.
   */
  manageSubscriptions: ManageSubscriptions;

  /**
   * Function to clean up all subscriptions and resources associated with the
   * selector.
   */
  unsubscribe: () => void;
};

/**
 * Creates the methods required to manage a selector's value calculation,
 * subscriptions, and cleanup.
 * - Collects key handles for dependency tracking.
 * - Provides a calculateValue function for selector evaluation.
 * - Provides a manageSubscriptions function to wire up and manage
 *   subscriptions.
 * - Provides an unsubscribe function to clean up all associated resources.
 *
 * @param selector The selector for which to create management methods.
 * @param runOverState Function to evaluate the selector over the current state.
 * @returns An object with calculateValue, manageSubscriptions, and unsubscribe
 * methods.
 */
const createSubscriptionManagementForSelector = <State extends object, V>(
  selector: Selector<State, V>,
  runOverState: RunOverState<State>
): SubscriptionManagementMethods<V> => {
  let collectedKeyHandles: Set<KeyHandle> | undefined;
  let unsubscribeChunks: UnsubscribeFromState[] | undefined;

  const keyHandleCollector: KeyHandleCollector = (keyHandle) => {
    collectedKeyHandles ??= new Set();
    collectedKeyHandles.add(keyHandle);
  };

  const calculateValue = () =>
    /**
     * Ensures the key handles are collected and memoized on the first run. On
     * subsequent runs, uses the memoized set of key handles.
     */
    runOverState(selector, collectedKeyHandles ? undefined : keyHandleCollector);

  const manageSubscriptions = (immediateTask: () => void, selectorTrigger: SelectorTrigger) => {
    const unsubscribeChunksIsToPopulate = !unsubscribeChunks;
    unsubscribeChunks ??= [];

    collectedKeyHandles?.forEach((handle) => {
      const unsubscribeCallback = handle(immediateTask, selectorTrigger);
      unsubscribeChunksIsToPopulate && unsubscribeChunks?.push(unsubscribeCallback);
    });
  };

  const unsubscribe = () => {
    unsubscribeChunks?.forEach((unsubscribe): void => {
      unsubscribe();
    });
  };

  return { calculateValue, manageSubscriptions, unsubscribe };
};
