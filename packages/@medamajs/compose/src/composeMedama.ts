import {
  type Pupil,
  type Resubscribe,
  type Selector,
  type SubscribeToState,
  type Subscription,
  type SubscriptionJob,
  type SubscriptionMethods,
  type TransferSubscription,
  type UnsubscribeFromState,
} from 'medama';
import type {
  CStateG,
  CompositeState,
  LayerPupils,
  LayerPupilsPreventInference,
  RevealLayersInStateRecursively,
} from './auxiliaryTypes';
import type { ComposeMedama, CompositeMedama, IsComposite } from './composeMedama.types';
import { _COMPOSITE_STATE_SIGNATURE, _RELAY_SUBSCRIPTION_MEANS } from './const';
import { forEachOnOwnNumerableProps } from './forEachOnOwnNumerableProps';
import { createJobQueue, type SelectorTrigger } from './jobQueue';
import {
  createReadWorkModeManager,
  createUpdateWorkModeManager,
  type Defer,
  type SubscribeToLayerWithSelector,
} from './modeManager';
import { traverseThroughPupils, type ProcessLayer } from './traverseThroughPupils';

/**
 * Initialize read and update mode managers that handle state access
 * coordination. These managers control concurrent access patterns and
 * subscription handling. See modeManager.ts for detailed implementation.
 */
const {
  getReadWorkState,
  runWithReadModeOn,
  setSubscriptionMeansRequested,
  getRequestSubscriptionMeansState,
  resetReadWorkMode,
} = createReadWorkModeManager();

const {
  getUpdateWorkState,
  startUpdating,
  signalDeferredJobsToResolve,
  createDeferrer,
  getSubscribeToLayerWithSelector,
  resetUpdateWorkMode,
} = createUpdateWorkModeManager();

type SubscriptionMeansInState = {
  /**
   * Array of subscription methods that are collected and combined during the
   * initial evaluation of a selector. These methods are used to create a
   * unified subscription mechanism for nested state changes.
   */
  [_RELAY_SUBSCRIPTION_MEANS]?: SubscriptionChunk[];
};

/**
 * composeMedama is the main function that composes multiple layers of state
 * management into a single cohesive unit. It allows for the creation of
 * composite states that can be read and updated in a coordinated manner. The
 * function maintains all original createMedama guarantees, including
 * subscription handling and Pupil methods consistency across composed states.
 *
 * @param layers - A record of state layers, each associated with a Pupil
 * instance.
 * @param initState - An optional initial state to set for the composed layers.
 * @returns A Pupil instance exposing methods to interact with the composed
 * state. This pupil can be used as a layer in subsequent composeMedama calls
 * for higher-level composition.
 */
export const composeMedama = (<State extends CStateG>(
  layers: Record<keyof State, Pupil<State[keyof State]>>,
  initState?: Partial<State>
): CompositeMedama<State> => {
  const {
    addToQueue: addToStateQueue,
    processQueue: processStateQueue,
    resetQueue: resetStateQueue,
  } = createJobQueue();

  const { defer: addToStateQueueAndSubscribe, reset: resetStateQueueSubscription } = createDeferrer(
    addToStateQueue,
    processStateQueue
  );

  /**
   * Resets all state management components to their default values. Called
   * during initialization and error handling to ensure a clean state if an
   * error occurs during any state operation (read/update/subscribe).
   */
  const initReset = (): void => {
    resetStateQueue();
    resetReadWorkMode();
    resetUpdateWorkMode();
    resetStateQueueSubscription();
  };

  initReset();

  const pupilRecords: [keyof State, Pupil<State[keyof State]>][] = forEachOnOwnNumerableProps(
    layers,
    (key, layer) => [key, layer] as const
  );

  const pupilMap = Object.fromEntries(pupilRecords) as Record<
    keyof State,
    Pupil<State[keyof State]>
  >;

  initState != null &&
    pupilRecords.forEach(([key, { setState }]) => {
      key in initState && setState(initState[key] as State[keyof State]);
    });

  /**
   * Central store that maps selectors to their corresponding read and subscribe
   * methods. Uses WeakMap to allow garbage collection of selectors when they
   * are no longer referenced, preventing memory leaks in long-running
   * applications.
   */
  let selectorStore = new WeakMap<Selector<State, unknown>, SelectorRecord<unknown>>();

  const readState = <V>(compositeSelector: Selector<State, V>): V => {
    try {
      if (selectorStore.has(compositeSelector)) {
        const { getValue } = selectorStore.get(compositeSelector) as SelectorRecord<V>;

        return getValue();
      }

      const { processLayer, getSubscriptionMeans } =
        createLayerProcessorWithSubscriptionMeans<State>();

      /**
       * Indicates if this is the primary/initiating call to readState for this
       * selector. For nested composite states, readState can be called
       * recursively:
       * - Initiator calls (isInitiator = true): Consumes subscription means and
       *   handles selector memoization
       * - Derivative calls (isInitiator = false): Process nested layers and
       *   relay subscription means up the chain through the
       *   _RELAY_SUBSCRIPTION_MEANS state property
       */
      const isInitiator = !getReadWorkState();

      /**
       * Calculates the result for compositeSelector by:
       * 1. Traversing through all nested states to build a combined state object
       * 2. Optionally collecting and combining subscription means from nested
       *    layers to propagate them up the chain
       * 3. Applying the compositeSelector to the final combined state
       *
       * For non-initiator calls with subscription means requested, it adds
       * collected subscription means to the state before passing to selector.
       */
      const calculateResultFromLayers = (): V =>
        traverseThroughPupils(
          pupilRecords,
          processLayer,

          !isInitiator && getRequestSubscriptionMeansState()
            ? (combinedLayers) => {
                (combinedLayers as SubscriptionMeansInState)[_RELAY_SUBSCRIPTION_MEANS] =
                  getSubscriptionMeans() ?? [];

                return compositeSelector(combinedLayers);
              }
            : compositeSelector
        );

      /**
       * For initiator calls only: handles selector memoization in
       * selectorStore. Skipped for derivative calls since nested composite
       * states use their selectors only once and don't need memoization.
       */
      if (isInitiator) {
        const selectorRecord = createSelectorRecord(
          calculateResultFromLayers,
          addToStateQueueAndSubscribe,
          getSubscriptionMeans
        );

        /**
         * Store read and subscribe methods for this selector in WeakMap. These
         * methods are memoized to avoid recalculating selector results and
         * rebuilding subscription chains on subsequent reads.
         */
        selectorStore.set(compositeSelector, selectorRecord);
        setSubscriptionMeansRequested();
        const { getValue } = selectorRecord;

        return getValue();
      }

      return calculateResultFromLayers();
    } catch (e) {
      initReset();

      throw e;
    }
  };

  const subscribeToState = <V>(
    compositeSelector: Selector<State, V>,
    subscription: Subscription<V>
  ): SubscriptionMethods<State, V> => {
    try {
      /**
       * Calculate compositeSelector result to ensure selector record exists in
       * selectorStore. While we don't use the result here, this call creates
       * necessary memoization records, avoiding recalculation when running
       * subscription functions.
       */
      readState(compositeSelector);

      let currentSelectorStoreRecord = selectorStore.get(compositeSelector) as SelectorRecord<V>;
      let unsubscribeHandle: UnsubscribeFromState | null = null;
      let currentRevealedSubscriptionJob: SubscriptionJob<V>;

      const evaluateAndSubscribe = (subscriptionToReveal: Subscription<V>): void => {
        /**
         * Allow state mutations during subscription setup - a distinct feature
         * of composite state. Original medama would error on state changes
         * during subscription, but here we handle it by wrapping in update mode
         * and resolving deferred jobs after subscription setup.
         */
        startUpdating();

        const { addSubscription, getValue } = currentSelectorStoreRecord;
        const possibleSubscriptionJob = subscriptionToReveal(getValue());

        currentRevealedSubscriptionJob =
          typeof possibleSubscriptionJob === 'function'
            ? possibleSubscriptionJob
            : subscriptionToReveal;

        unsubscribeHandle = addSubscription(currentRevealedSubscriptionJob);

        // Signal completion of potential state mutations during subscription
        signalDeferredJobsToResolve();
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
        readState(selectorToTransferTo);

        currentSelectorStoreRecord = selectorStore.get(selectorToTransferTo) as SelectorRecord<V>;

        evaluateAndSubscribe(currentRevealedSubscriptionJob);
      };

      return { unsubscribe, resubscribe, transfer };
    } catch (e) {
      initReset();

      throw e;
    }
  };

  const setState = <SChange extends Partial<State>>(
    stateChange: SChange | ((state: State) => SChange)
  ): SChange => {
    try {
      const isUpdateInitiator = !getUpdateWorkState();
      startUpdating();

      const mergeToState: Pick<SChange, keyof State> =
        typeof stateChange === 'function' ? readState(stateChange) : stateChange;

      forEachOnOwnNumerableProps(mergeToState, (key, toMerge) => {
        const { setState: setNestedState } = pupilMap[key] ?? {};

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        setNestedState?.(toMerge!);
      });

      isUpdateInitiator && signalDeferredJobsToResolve();

      return mergeToState;
    } catch (e) {
      initReset();

      throw e;
    }
  };

  const resetState = (initState?: Partial<State>): void => {
    initReset();

    pupilRecords.forEach(([key, { resetState }]) => {
      resetState(initState?.[key]);
    });

    selectorStore = new WeakMap();
  };

  const addLayers = <LayersToAdd extends CStateG>(
    layersToAdd: Record<keyof LayersToAdd, Pupil<LayersToAdd[keyof LayersToAdd]>>,
    initState?: Partial<State & LayersToAdd>
  ) =>
    composeMedama<State & LayersToAdd>(
      Object.assign(Object.create(null), layers, layersToAdd) as LayerPupilsPreventInference<
        State & LayersToAdd
      >,

      initState as RevealLayersInStateRecursively<State & LayersToAdd> | undefined
    );

  const deleteLayers = (layersToDelete: string | string[]) => {
    const nextLayers = Object.assign(Object.create(null), layers);

    (Array.isArray(layersToDelete) ? layersToDelete : [layersToDelete]).forEach((layerK) => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete nextLayers[layerK];
    });

    return composeMedama(nextLayers as LayerPupils<CStateG>);
  };

  const pupil = {
    readState,
    subscribeToState,
    setState,
    resetState,
    addLayers,
    deleteLayers,
  } as CompositeMedama<State>;

  return Object.assign(pupil, { pupil });
}) as ComposeMedama;

type SubscriptionChunk = {
  subscribeToLayer: SubscribeToState<{}>;
  layerSelector: () => void;
};

type GetSubscriptionMeans = () => SubscriptionChunk[] | undefined;

/**
 * Creates methods for handling layer processing and subscription means
 * collection.
 *
 * @returns Object containing processLayer and getSubscriptionMeans methods
 */
const createLayerProcessorWithSubscriptionMeans = <State extends CStateG>(): {
  /**
   * Function used by traverseThroughPupils to:
   * - Build the combinedLayer state object
   * - On demand, populate combinedLayer with subscription means from root
   *   states or relay combined means from nested states
   */
  processLayer: ProcessLayer<State, State>;

  /**
   * Function to retrieve all subscription means collected during layer
   * processing. Returns array of subscription methods combined from both root
   * states and nested composite states.
   */
  getSubscriptionMeans: GetSubscriptionMeans;
} => {
  const subscriptionMeans: SubscriptionChunk[] = [];
  let neverRun = true;

  const processLayer: ProcessLayer<State, State> = (
    key,
    layerState,
    subscribeToLayer,
    selectorIdentity,

    combinedLayers = Object.defineProperty(
      Object.create(null) as State,
      _COMPOSITE_STATE_SIGNATURE,
      {
        // Special key used to distinguish composite states from root states. This
        // allows selectors to handle state objects differently based on their
        // origin
        value: true,
      }
    )
  ): State => {
    neverRun = false;
    (combinedLayers as State)[key] = layerState;

    if (getRequestSubscriptionMeansState()) {
      if (_RELAY_SUBSCRIPTION_MEANS in layerState) {
        (layerState as SubscriptionMeansInState)[_RELAY_SUBSCRIPTION_MEANS]?.forEach((chunk) => {
          subscriptionMeans.push(chunk);
        });

        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete (layerState as SubscriptionMeansInState)[_RELAY_SUBSCRIPTION_MEANS];
      } else {
        subscriptionMeans.push({ subscribeToLayer, layerSelector: selectorIdentity as () => void });
      }
    }

    return combinedLayers;
  };

  const getSubscriptionMeans = (): SubscriptionChunk[] | undefined =>
    neverRun ? undefined : subscriptionMeans;

  return { processLayer, getSubscriptionMeans };
};

/**
 * Adds subscription job to run when selector value changes. Returns cleanup
 * function to remove subscription.
 *
 * @template V The type of the selector value
 */
type AddSubscription<V> = (subscriptionJob: SubscriptionJob<V>) => () => void;

/**
 * Gets memoized selector value, recalculating only if needed. Ensures selector
 * is registered even without active subscriptions.
 *
 * @template V The type of the selector value
 */
type GetValue<V> = () => V;

type SelectorRecord<V> = {
  /**
   * Adds subscription job to run when selector value changes. Returns cleanup
   * function to remove subscription.
   */
  addSubscription: AddSubscription<V>;

  /**
   * Gets memoized selector value, recalculating only if needed. Ensures
   * selector is registered even without active subscriptions.
   */
  getValue: GetValue<V>;
};

/**
 * Creates a record to manage selector value calculation and subscriptions.
 * Handles:
 * - Lazy calculation of selector value with memoization
 * - Subscription management for state changes
 * - Automatic cleanup when no subscriptions remain
 *
 * @param calculateResult Function to compute selector value
 * @param addToStateQueueAndSubscribeOrRun Function to handle state updates
 * @param getSubscriptionMeans Function to get subscription methods
 * @returns Record with methods for value retrieval and subscription management
 */
const createSelectorRecord = <V>(
  calculateResult: () => V,
  addToStateQueueAndSubscribeOrRun: Defer<SelectorTrigger>,
  getSubscriptionMeans: GetSubscriptionMeans
): SelectorRecord<V> => {
  /**
   * Function to unsubscribe from all nested layer subscriptions
   */
  let unsubscribePoolFromLayers: () => void;

  /**
   * Indicates if the selector is currently registered with subscriptions
   */
  let isRegistered = false;

  /**
   * Memoized selector result value
   */
  let memValue: V;

  /**
   * Flag indicating if selector value needs recalculation
   */
  let isToRecalculateValue = true;

  /**
   * Recalculates selector value only if dependencies have changed. Runs
   * calculation in read mode to ensure proper dependency tracking.
   */
  const runSelectorWithMemoization = (): void => {
    if (isToRecalculateValue) {
      runWithReadModeOn(() => {
        memValue = calculateResult();
      });

      isToRecalculateValue = false;
    }
  };

  let isToAddValue = false;

  /**
   * Marks the selector as needing recalculation.
   * This is called when a dependency in a nested layer changes, ensuring that
   * the selector value will be recomputed the next time it is accessed or when a trigger fires.
   */
  const immediateTask = () => {
    if (isToRecalculateValue) return;

    isToRecalculateValue = true;
    isToAddValue = true;
  };

  /**
   * Collection of subscription jobs that run when selector value changes
   */
  const jobs = new Set<SubscriptionJob<V>>();

  const selectorTrigger: SelectorTrigger = {
    /**
     * Triggered when selector dependencies change. Handles recalculation and
     * subscription notifications. Cleans up when no subscriptions remain.
     */
    trigger: (): void => {
      if (jobs.size === 0) {
        unsubscribePoolFromLayers();

        return;
      }

      runSelectorWithMemoization();

      jobs.forEach((job): void => {
        job(memValue);
      });
    },

    isToAdd: (): boolean => {
      const toReturn = isToAddValue;
      isToAddValue = false;

      return toReturn;
    },
  };

  let subscribeMethodsCached: SubscribeToLayerWithSelector[] | undefined = undefined;

  /**
   * Registers selector's subscriptions with nested layers. Creates combined
   * subscription from all layer subscriptions. Prevents duplicate registrations
   * via isRegistered flag.
   */
  const registerTrigger = (): void => {
    if (isRegistered) return;

    const layerTriggerSubscription = () => {
      addToStateQueueAndSubscribeOrRun(immediateTask, selectorTrigger);
    };

    subscribeMethodsCached ??= getSubscriptionMeans()?.map(({ subscribeToLayer, layerSelector }) =>
      getSubscribeToLayerWithSelector(subscribeToLayer, layerSelector)
    );

    const unsubscribeChunks =
      subscribeMethodsCached?.map((subscribeToLayerWithSelector) =>
        subscribeToLayerWithSelector(layerTriggerSubscription)
      ) ?? [];

    unsubscribePoolFromLayers = (): void => {
      if (!isRegistered) return;

      unsubscribeChunks.forEach((unsubscribe): void => {
        unsubscribe();
      });

      isRegistered = false;
    };

    isRegistered = true;
  };

  const getValue: GetValue<V> = () => {
    runSelectorWithMemoization();
    registerTrigger();

    return memValue;
  };

  const addSubscription: AddSubscription<V> = (subscriptionJob) => {
    jobs.add(subscriptionJob);

    return () => {
      jobs.delete(subscriptionJob);
    };
  };

  return { addSubscription, getValue };
};

/**
 * Helper function to distinguish between root and composite states in practical
 * scenarios. Essential when implementing selectors that need to handle state
 * objects differently based on their origin:
 * - States directly created by createMedama (root states)
 * - States composed from multiple layers via composeMedama (composite states)
 *
 * @param state State object to check
 * @returns True if state is composite (created by composeMedama), false if root
 * state
 */
export const isComposite: IsComposite = <State extends object>(
  state: State
): state is State extends CStateG ? CompositeState<State> : never =>
  _COMPOSITE_STATE_SIGNATURE in state;
