import {
  createMedama,
  selectStateEntriesChanged,
  type Selector,
  type SubscribeToState,
  type UnsubscribeFromState,
} from 'medama';

/**
 * Runs the given job with subscription means collection enabled for the
 * duration of the job. Ensures that nested composite states collect and relay
 * subscription means up the chain.
 *
 * @param job Function to execute with subscription means collection enabled
 * @returns The return value of the executed job
 */
type RunWithSubscriptionMeansRequested = <V>(job: () => V) => V;

type ReadWorkModeMethods = {
  /**
   * Runs the given job with subscription means collection enabled for the
   * duration of the job. Ensures that nested composite states collect and relay
   * subscription means up the chain.
   */
  runWithSubscriptionMeansRequested: RunWithSubscriptionMeansRequested;

  /**
   * Returns current subscription means requested state. True indicates that
   * nested composite states should collect and relay subscription means up the
   * chain.
   */
  getRequestSubscriptionMeansState: () => boolean;

  /**
   * Resets subscription means requested state to false. Used during
   * initialization and error handling to ensure clean state.
   */
  resetReadWorkMode: () => void;
};

/**
 * Creates a manager to control subscription means collection mode, which
 * controls if nested states should collect subscriptions. Provides methods to
 * control subscription means collection and reset state during initialization
 * or error handling.
 */
export const createReadWorkModeManager = (): ReadWorkModeMethods => {
  let requestSubscriptionMeansState = false;

  const runWithSubscriptionMeansRequested: RunWithSubscriptionMeansRequested = (job) => {
    requestSubscriptionMeansState = true;
    const toReturn = job();
    requestSubscriptionMeansState = false;

    return toReturn;
  };

  const getRequestSubscriptionMeansState = (): boolean => requestSubscriptionMeansState;

  const resetReadWorkMode = (): void => {
    requestSubscriptionMeansState = false;
  };

  return {
    runWithSubscriptionMeansRequested,
    getRequestSubscriptionMeansState,
    resetReadWorkMode,
  };
};

/**
 * Defers job and subscribes to resolution signal (if not already subscribed).
 *
 * @param runImmediately Function to execute job immediately if conditions allow
 * @param job Object or function representing the job to be deferred
 */
export type Defer<Job> = (runImmediately: () => void, job: Job) => void;

type Reset = () => void;

type DeferrerMethods<Job> = {
  /**
   * Defers job and subscribes to resolution signal (if not already subscribed)
   */
  defer: Defer<Job>;

  /**
   * Resets subscription state to false. Used during initialization and error
   * handling to ensure clean state.
   */
  reset: Reset;
};

/**
 * Creates a handler that defers jobs. Provides subscription mechanism to
 * resolve deferred jobs when signaled.
 *
 * @param deferJob Function to add a job to the deferred queue
 * @param resolveDeferred Function to process all deferred jobs when signaled
 * @returns An object with methods to defer jobs and reset subscription state
 */
type CreateDeferrer = <Job>(
  deferJob: (job: Job) => void,
  resolveDeferred: () => void
) => DeferrerMethods<Job>;

/**
 * Subscribes to a layer's state changes using a selector, with signal
 * management for deferred job resolution.
 *
 * @param subscription Callback to execute when the selected state changes
 * @returns Unsubscribe function for the subscription
 */
export type SubscribeToLayerWithSelector = (subscription: () => void) => UnsubscribeFromState;

/**
 * Returns a function that subscribes to a layer's state changes with a
 * selector, ensuring signal management for deferred job resolution. Handles
 * subscription record caching.
 *
 * @param subscribeToLayer The layer's subscribe function
 * @param selector Selector for the layer's state
 * @returns Function to subscribe with signal management
 */
type GetSubscribeToLayerWithSelector = (
  subscribeToLayer: SubscribeToState<{}>,
  selector: Selector<{}, void>
) => SubscribeToLayerWithSelector;

type UpdateWorkModeMethods = {
  /**
   * Returns current update work state. True indicates that update process is in
   * progress and new jobs should be deferred rather than executed immediately.
   */
  getUpdateWorkState: () => boolean;

  /**
   * Sets update work state to true, indicating start of update process. Used to
   * mark that any new jobs should be deferred rather than executed immediately.
   */
  startUpdating: () => void;

  /**
   * Signals resolution of deferred jobs and sets update work state to false.
   * Triggers execution of all deferred jobs in the queue.
   */
  signalDeferredJobsToResolve: () => void;

  /**
   * Creates a handler that defers jobs. Provides subscription mechanism to
   * resolve deferred jobs when signaled.
   */
  createDeferrer: CreateDeferrer;

  /**
   * Returns a function that subscribes to a layer's state changes with a
   * selector, ensuring signal management for deferred job resolution. Handles
   * subscription record caching.
   */
  getSubscribeToLayerWithSelector: GetSubscribeToLayerWithSelector;

  /**
   * Resets signal state and update work state to false. Used during
   * initialization and error handling to ensure clean state.
   */
  resetUpdateWorkMode: () => void;
};

type SignalToResolveDeferredJobsState = {
  signal: object;
};

/**
 * Subscribes to both the layer's state changes and the signal for resolving
 * deferred jobs. Ensures that job counting and signal subscription are managed
 * correctly for the layer.
 *
 * @param selector Selector for the layer's state
 * @param subscription Callback to execute when the layer's state changes
 * @returns Unsubscribe function for the subscription
 */
type SubscribeAndManageDeferring = (
  selector: Selector<{}, void>,
  subscription: () => void
) => UnsubscribeFromState;

type LayerSubscriptionRecord = {
  /**
   * Subscribes to both the layer's state changes and the signal for resolving
   * deferred jobs. Ensures that job counting and signal subscription are
   * managed correctly for the layer.
   */
  subscribeAndManageDeferring: SubscribeAndManageDeferring;
};

/**
 * Creates a manager to control update work mode and deferred job handling. This
 * manager is responsible for:
 * - Tracking whether an update process is currently active (update work state)
 * - Deferring jobs when updates are in progress, and executing them when
 *   signaled
 * - Providing a mechanism to signal when deferred jobs should be resolved
 * - Creating deferrer instances that handle job execution timing based on a
 *   signal
 * - Managing subscriptions for state changes and deferred job resolution using
 *   medama state
 *
 * @returns Object containing methods to manage update work mode, job deferral,
 * and signal-based resolution
 */
export const createUpdateWorkModeManager = (): UpdateWorkModeMethods => {
  let updateWorkState = false;

  /**
   * Stores a mapping from a subscribeToLayer function to its layer subscription
   * record. Used to manage subscriptions for each layer independently.
   */
  const layerSubscriptionStore = new WeakMap<SubscribeToState<{}>, LayerSubscriptionRecord>();

  const getUpdateWorkState = (): boolean => updateWorkState;

  const startUpdating = (): void => {
    updateWorkState = true;
  };

  const {
    subscribeToState: subscribeToSignalState,
    setState: setSignalState,
    resetState: resetSignalState,
  } = createMedama<SignalToResolveDeferredJobsState>();

  const signalToResolveSelector = ({ signal }: SignalToResolveDeferredJobsState): object => signal;

  const signalDeferredJobsToResolve = (): void => {
    setSignalState({ signal: {} });
    updateWorkState = false;
  };

  const subscribeForResolvingWhenSignalled = (callback: () => void): void => {
    const { unsubscribe } = subscribeToSignalState(
      signalToResolveSelector,

      (): (() => void) => () => {
        callback();
        unsubscribe();
      }
    );
  };

  const createDeferrer: CreateDeferrer = (deferJob, resolveDeferred) => {
    let subscribed = false;

    return {
      defer: (runImmediately, job) => {
        runImmediately();
        deferJob(job);

        if (subscribed) return;

        subscribeForResolvingWhenSignalled((): void => {
          resolveDeferred();
          subscribed = false;
        });

        subscribed = true;
      },

      reset: () => {
        subscribed = false;
      },
    };
  };

  /**
   * Creates a subscription record for managing signal-based job resolution for
   * a given layer. Handles subscription lifecycle and job counting for deferred
   * job signaling.
   */
  const createLayerSubscriptionRecord = (
    subscribeToLayer: SubscribeToState<{}>
  ): LayerSubscriptionRecord => {
    let countJobs = 0;
    let unsubscribeSignalTrigger: (() => void) | undefined;

    const signalTrigger = () => () => {
      updateWorkState || setSignalState({ signal: {} });
    };

    const subscribeAndManageDeferring: SubscribeAndManageDeferring = (selector, subscription) => {
      countJobs++ === 0 &&
        (unsubscribeSignalTrigger = subscribeToLayer(
          selectStateEntriesChanged,
          signalTrigger
        ).unsubscribe);

      const { unsubscribe } = subscribeToLayer(selector, () => subscription);

      return () => {
        --countJobs === 0 && unsubscribeSignalTrigger?.();
        unsubscribe();
      };
    };

    return {
      subscribeAndManageDeferring,
    };
  };

  const getSubscribeToLayerWithSelector: GetSubscribeToLayerWithSelector = (
    subscribeToLayer,
    selector
  ) => {
    const signalSubscriptionRecord =
      layerSubscriptionStore.get(subscribeToLayer) ??
      createLayerSubscriptionRecord(subscribeToLayer);

    layerSubscriptionStore.set(subscribeToLayer, signalSubscriptionRecord);
    const { subscribeAndManageDeferring } = signalSubscriptionRecord;
    signalSubscriptionRecord.subscribeAndManageDeferring;

    return (subscription: () => void) => subscribeAndManageDeferring(selector, subscription);
  };

  const resetUpdateWorkMode = (): void => {
    resetSignalState();
    updateWorkState = false;
  };

  return {
    getUpdateWorkState,
    startUpdating,
    signalDeferredJobsToResolve,
    createDeferrer,
    getSubscribeToLayerWithSelector,
    resetUpdateWorkMode,
  };
};
