import { createMedama } from 'medama';

type ReadWorkModeMethods = {
  /**
   * Returns current read work state. True indicates that reading process is in
   * progress and any nested reads should be treated as derivative calls rather
   * than initiator calls.
   */
  getReadWorkState: () => boolean;

  /**
   * Sets read work state to true, indicating start of reading process. Used to
   * mark that any subsequent nested reads should be treated as derivative
   * calls.
   */
  startReading: () => void;

  /**
   * Sets read work state and subscription means requested state to false. Marks
   * completion of reading process and subscription collection.
   */
  finishReading: () => void;

  /**
   * Sets subscription means requested state to true. Indicates that nested
   * composite states should collect and relay subscription means up the chain.
   */
  setSubscriptionMeansRequested: () => void;

  /**
   * Returns current subscription means requested state. True indicates that
   * nested composite states should collect and relay subscription means up the
   * chain.
   */
  getRequestSubscriptionMeansState: () => boolean;

  /**
   * Resets both read work state and subscription means requested state to
   * false. Used during initialization and error handling to ensure clean state.
   */
  resetReadWorkMode: () => void;
};

/**
 * Creates a manager to control read work mode and subscription collection
 * state. Manages two key states:
 * - Read work state: Tracks if reading process is active
 * - Subscription means state: Controls if nested states should collect
 *   subscriptions
 *
 * Provides methods to:
 * - Start/finish reading operations
 * - Control subscription means collection
 * - Reset states during initialization or error handling
 *
 * @returns Object containing methods to manage read work mode
 */
export const createReadWorkModeManager = (): ReadWorkModeMethods => {
  let readWorkState = false;
  let requestSubscriptionMeansState = false;

  const getReadWorkState = (): boolean => readWorkState;

  const startReading = (): void => {
    readWorkState = true;
  };

  const finishReading = (): void => {
    readWorkState = false;
    requestSubscriptionMeansState = false;
  };

  const setSubscriptionMeansRequested = (): void => {
    requestSubscriptionMeansState = true;
  };

  const getRequestSubscriptionMeansState = (): boolean => requestSubscriptionMeansState;

  const resetReadWorkMode = (): void => {
    readWorkState = false;
    requestSubscriptionMeansState = false;
  };

  return {
    getReadWorkState,
    startReading,
    finishReading,
    setSubscriptionMeansRequested,
    getRequestSubscriptionMeansState,
    resetReadWorkMode,
  };
};

type ConditionalDeferrerMethods = {
  /**
   * Either runs job immediately or defers it based on update work state:
   * - If not in update mode: runs job immediately
   * - If in update mode: defers job and subscribes to resolution signal (if not
   *   already subscribed)
   */
  deferOrRun: (job: () => void) => void;

  /**
   * Resets subscription state to false. Used during initialization and error
   * handling to ensure clean state.
   */
  reset: () => void;
};

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
   * Creates a handler that either runs jobs immediately or defers them based on
   * current state. Provides subscription mechanism to resolve deferred jobs
   * when signaled.
   *
   * @param deferJob Function to add job to deferred queue
   * @param resolveDeferred Function to process deferred queue
   */
  createConditionalDeferrer: (
    deferJob: (job: () => void) => void,
    resolveDeferred: () => void
  ) => ConditionalDeferrerMethods;

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
 * Creates a manager to control update work mode and deferred job handling.
 * Manages update state and provides mechanisms for:
 * - Controlling when jobs should be deferred vs executed immediately
 * - Signaling when deferred jobs should be processed
 * - Creating conditional deferrer instances that handle job execution timing
 *
 * Uses medama state to manage signaling system for deferred job resolution.
 *
 * @returns Object containing methods to manage update work mode and job
 * deferral
 */
export const createUpdateWorkModeManager = (): UpdateWorkModeMethods => {
  let updateWorkState = false;

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

  const createConditionalDeferrer = (
    deferJob: (job: () => void) => void,
    resolveDeferred: () => void
  ): ConditionalDeferrerMethods => {
    let subscribed = false;

    return {
      deferOrRun: (job): void => {
        if (updateWorkState === false) {
          job();

          return;
        }

        deferJob(job);

        if (subscribed) return;

        subscribeForResolvingWhenSignalled((): void => {
          resolveDeferred();
          subscribed = false;
        });

        subscribed = true;
      },

      reset: (): void => {
        subscribed = false;
      },
    };
  };

  const resetUpdateWorkMode = (): void => {
    resetSignalState();
    updateWorkState = false;
  };

  return {
    getUpdateWorkState,
    startUpdating,
    signalDeferredJobsToResolve,
    createConditionalDeferrer,
    resetUpdateWorkMode,
  };
};
