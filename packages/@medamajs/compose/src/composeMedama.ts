import {
  type Pupil,
  type Selector,
  type SubscribeToState,
  type Subscription,
  type SubscriptionJob,
  type SubscriptionMethods,
} from 'medama';
import type { CStateG, CompositeState } from './auxiliaryTypes';
import type { ComposeMedama, IsComposite } from './composeMedama.types';
import { _COMPOSITE_STATE_SIGNATURE, _RELAY_SUBSCRIPTION_MEANS } from './const';
import { forEachOnOwnNumerableProps } from './forEachOnOwnNumerableProps';
import { createJobQueue } from './jobQueue';
import { createReadWorkModeManager, createUpdateWorkModeManager } from './modeManager';
import { retrieveWithUpdateRequest } from './retrieveWithUpdateRequest';
import { traverseThroughPupils } from './traverseThroughPupils';

/**
 * Initialize read and update mode managers that handle state access
 * coordination. These managers control concurrent access patterns and
 * subscription handling. See modeManager.ts for detailed implementation.
 */
const {
  getReadWorkState,
  startReading,
  finishReading,
  setSubscriptionMeansRequested,
  getRequestSubscriptionMeansState,
  resetReadWorkMode,
} = createReadWorkModeManager();

const {
  getUpdateWorkState,
  startUpdating,
  signalDeferredJobsToResolve,
  createConditionalDeferrer,
  resetUpdateWorkMode,
} = createUpdateWorkModeManager();

type SubscribeJobToKnownSelector<V> = (job: SubscriptionJob<V>) => () => void;

type SelectorStoreRecord<V> = {
  /**
   * Function to subscribe to selector value changes. Takes a subscription job
   * and returns cleanup function. Uses memoized selector result to avoid
   * recalculations.
   */
  subscribe: SubscribeJobToKnownSelector<V>;

  /**
   * Function to read current selector value. Returns memoized result,
   * recalculating only when state changes.
   */
  read: () => V;
};

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
const composeMedama = <State extends CStateG>(
  layers: Record<keyof State, Pupil<State[keyof State]>>,
  initState?: Partial<State>
): Pupil<State> => {
  const {
    addToQueue: addToStateQueue,
    processQueue: processStateQueue,
    resetQueue: resetStateQueue,
  } = createJobQueue();

  const { deferOrRun: addToStateQueueAndSubscribeOrRun, reset: resetStateQueueSubscription } =
    createConditionalDeferrer(addToStateQueue, processStateQueue);

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
  let selectorStore = new WeakMap<Selector<State, unknown>, SelectorStoreRecord<unknown>>();

  const readState = <V>(compositeSelector: Selector<State, V>): V => {
    try {
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
       * 1. Traversing through all nested states to build a combined state
       *    object
       * 2. Optionally collecting and combining subscription means from nested
       *    layers to propagate them up the chain
       * 3. Applying the compositeSelector to the final combined state
       *
       * For non-initiator calls with subscription means requested, it adds
       * collected subscription means to the state before passing to selector.
       */
      const getResult = (): V =>
        traverseThroughPupils(
          pupilRecords,
          processLayer,

          !isInitiator && getRequestSubscriptionMeansState()
            ? (combinedLayers) => {
                (combinedLayers as SubscriptionMeansInState)[_RELAY_SUBSCRIPTION_MEANS] =
                  getSubscriptionMeans();

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
        if (!selectorStore.has(compositeSelector)) {
          const addJobToSubscriptionPool = createAddJobToSubscriptionPoolMethod(
            addToStateQueueAndSubscribeOrRun,
            getSubscriptionMeans
          );

          const { retrieve: getSelectorResult, requestUpdate } = retrieveWithUpdateRequest(
            (): V => {
              /**
               * Marks the start of reading state. Ensures any subsequent reads
               * of nested composite layers are treated as derivative calls,
               * maintaining both proper subscription chain propagation and
               * selector memoization process through the layer hierarchy.
               */
              startReading();

              /**
               * Returns an array with:
               * 1. Result from getResult()
               * 2. finishReading() to mark end of state reading and
               *    subscription collection
               * 3. Adding service job to subscription pool that requests
               *    selector value updates when state changes occur
               *
               * Returns first element (getResult value) via [0] index
               */
              return (
                [getResult(), finishReading(), addJobToSubscriptionPool(requestUpdate)] as const
              )[0];
            }
          );

          /**
           * Creates subscription handler for a known selector. When called:
           * 1. Wraps the subscription job to use memoized selector result
           * 2. Adds wrapped job to subscription pool
           * 3. Returns cleanup function to remove job from pool
           *
           * @param subscriptionJob Function to run when selector value changes
           * @returns Cleanup function to remove subscription
           */
          const subscribeJobToSelector: SubscribeJobToKnownSelector<V> = (subscriptionJob) => {
            const jobToAdd = (): void => {
              subscriptionJob(getSelectorResult());
            };

            return addJobToSubscriptionPool(jobToAdd);
          };

          /**
           * Store read and subscribe methods for this selector in WeakMap.
           * These methods are memoized to avoid recalculating selector results
           * and rebuilding subscription chains on subsequent reads.
           */
          selectorStore.set(compositeSelector, {
            subscribe: subscribeJobToSelector,
            read: getSelectorResult,
          });

          setSubscriptionMeansRequested();
        }

        const { read } = selectorStore.get(compositeSelector) as SelectorStoreRecord<V>;

        return read();
      }

      return getResult();
    } catch (e) {
      initReset();

      throw e;
    }
  };

  const subscribeToState = <V>(
    compositeSelector: Selector<State, V>,
    subscription: Subscription<V>
  ): SubscriptionMethods<V> => {
    try {
      /**
       * Calculate compositeSelector result to ensure selector record exists in
       * selectorStore. While we don't use the result here, this call creates
       * necessary memoization records, avoiding recalculation when running
       * subscription functions.
       */
      readState(compositeSelector);
      const { subscribe, read } = selectorStore.get(compositeSelector) as SelectorStoreRecord<V>;

      const subscribeEvaluatedSubscription = (
        subscriptionToEvaluate: Subscription<V>
      ): (() => void) => {
        /**
         * Allow state mutations during subscription setup - a distinct feature
         * of composite state. Original medama would error on state changes
         * during subscription, but here we handle it by wrapping in update mode
         * and resolving deferred jobs after subscription setup.
         */
        startUpdating();
        const possibleSubscriptionJob = subscriptionToEvaluate(read());

        return (
          [
            subscribe(
              typeof possibleSubscriptionJob === 'function'
                ? possibleSubscriptionJob
                : subscriptionToEvaluate
            ),

            // Signal completion of potential state mutations during
            // subscription
            signalDeferredJobsToResolve(),
          ] as const
        )[0];
      };

      let unsubscribeHandle: (() => void) | null = subscribeEvaluatedSubscription(subscription);

      return {
        unsubscribe: (): void => {
          unsubscribeHandle?.();
          unsubscribeHandle = null;
        },

        resubscribe: (subscriptionToEvaluate: Subscription<V>): void => {
          unsubscribeHandle?.();
          unsubscribeHandle = subscribeEvaluatedSubscription(subscriptionToEvaluate);
        },
      };
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

      return (
        [mergeToState as SChange, isUpdateInitiator && signalDeferredJobsToResolve()] as const
      )[0];
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
    initState?: Partial<LayersToAdd>
  ): Pupil<State & LayersToAdd> =>
    composeMedama<State & LayersToAdd>(
      { ...layers, ...layersToAdd } as Record<
        keyof State | keyof LayersToAdd,
        Pupil<(State & LayersToAdd)[keyof State | keyof LayersToAdd]>
      >,

      initState as (State & LayersToAdd) | undefined
    );

  const deleteLayers = <K extends keyof State>(layersToDelete: K | K[]): Pupil<Omit<State, K>> => {
    const nextLayers = { ...layers };

    (Array.isArray(layersToDelete) ? layersToDelete : [layersToDelete]).forEach((layerK) => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete nextLayers[layerK];
    });

    return composeMedama(
      nextLayers as Record<keyof State, Pupil<Omit<State, K>[Exclude<keyof State, K>]>>
    );
  };

  const pupil = {
    readState,
    subscribeToState,
    setState,
    resetState,
  };

  const toReturn = {
    ...pupil,
    pupil,
    addLayers,
    deleteLayers,
  };

  return toReturn;
};

type ProcessLayer<State extends CStateG> = (
  key: keyof State,
  layerState: State[keyof State],
  subscribeToLayer: SubscribeToState<State[keyof State]>,
  selectorIdentity: (state: State[keyof State]) => void,
  combinedLayers?: State
) => State;

type SubscriptionChunk = (subscription: () => () => void) => () => void;

type GetSubscriptionMeans = () => SubscriptionChunk[];

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
  processLayer: ProcessLayer<State>;

  /**
   * Function to retrieve all subscription means collected during layer
   * processing. Returns array of subscription methods combined from both root
   * states and nested composite states.
   */
  getSubscriptionMeans: GetSubscriptionMeans;
} => {
  const subscriptionMeans: SubscriptionChunk[] = [];

  const processLayer = (
    key: keyof State,
    layerState: State[keyof State],
    subscribeToLayer: SubscribeToState<State[keyof State]>,
    selectorIdentity: (state: State[keyof State]) => void,

    combinedLayers: State = Object.defineProperty(Object.create(null), _COMPOSITE_STATE_SIGNATURE, {
      // Special key used to distinguish composite states from root states. This
      // allows selectors to handle state objects differently based on their
      // origin
      value: true,
    })
  ): State => {
    (combinedLayers as State)[key] = layerState;

    if (getRequestSubscriptionMeansState()) {
      if (_RELAY_SUBSCRIPTION_MEANS in layerState) {
        (layerState as SubscriptionMeansInState)[_RELAY_SUBSCRIPTION_MEANS]?.forEach((chunk) => {
          subscriptionMeans.push(chunk);
        });

        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete (layerState as SubscriptionMeansInState)[_RELAY_SUBSCRIPTION_MEANS];
      } else {
        subscriptionMeans.push(
          (subscription) => subscribeToLayer(selectorIdentity, subscription).unsubscribe
        );
      }
    }

    return combinedLayers;
  };

  const getSubscriptionMeans = (): SubscriptionChunk[] => subscriptionMeans;

  return { processLayer, getSubscriptionMeans };
};

/**
 * Creates a method to manage subscription pooling for composite selectors.
 * Maintains a pool of subscription jobs that need to run when state changes.
 * Ensures consistent subscription handling by:
 * - Creating a single combined subscription for all nested states
 * - Starting subscription when first job is added to empty pool
 * - Stopping subscription after pool execution `reveals only the selector update
 *   request job remains (this job is always present to keep selector result
 *   current)
 *
 * @param addToStateQueueAndSubscribeOrRun Method to queue or immediately run
 * state updates
 * @param getSubscriptionMeans Method to get combined subscription methods from
 * nested states
 * @returns Function that:
 *          - Takes a job to add to subscription pool
 *          - Returns cleanup function to remove job from pool
 */
const createAddJobToSubscriptionPoolMethod = (
  addToStateQueueAndSubscribeOrRun: (job: () => void) => void,
  getSubscriptionMeans: GetSubscriptionMeans
): ((job: () => void) => () => void) => {
  let isPoolSubscriptionActive = false;
  let unsubscribePoolFromLayers: () => void;

  const subscriptionPool = new Set<() => void>();

  const runSubscriptionPool = (): void => {
    subscriptionPool.forEach((piece) => {
      piece();
    });

    if (subscriptionPool.size === 1) {
      unsubscribePoolFromLayers();
      isPoolSubscriptionActive = false;
    }
  };

  const keepSubscriptionConsistent = (): void => {
    if (isPoolSubscriptionActive) return;

    const determineSubscriptionPoolExecution = (): void => {
      addToStateQueueAndSubscribeOrRun(runSubscriptionPool);
    };

    const unsubscribeChunks = getSubscriptionMeans().map((subscribeToLayer): (() => void) =>
      subscribeToLayer((): (() => void) => determineSubscriptionPoolExecution)
    );

    unsubscribePoolFromLayers = (): void => {
      unsubscribeChunks.forEach((unsubscribe): void => {
        unsubscribe();
      });
    };

    isPoolSubscriptionActive = true;
  };

  const addJobToSubscriptionPool = (job: () => void): (() => void) => {
    subscriptionPool.add(job);
    keepSubscriptionConsistent();

    return () => {
      subscriptionPool.delete(job);
    };
  };

  return addJobToSubscriptionPool;
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

const _composeMedama = composeMedama as ComposeMedama;

export { _composeMedama as composeMedama };
