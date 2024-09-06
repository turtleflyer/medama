import type { ReadState } from './medama.types';

/**
 * The return of the trigger is an indicator of it being valid. Otherwise it'll be invalidated and
 * removed.
 */
type SelectorTrigger = () => boolean;

export type RegisterSelectorTrigger<State extends object> = (
  selectorTrigger: SelectorTrigger
) => ReadState<State>;

type ProxyHandler<State> = {
  get: <K extends string | symbol>(target: State, p: K) => State[K & keyof State];
  set: <K extends string | symbol>(target: State, p: K, newValue: State[K & keyof State]) => true;
};

/**
 * The state image is a core flat object holding the state records. It provides an access to them
 * through a Proxy wrapping around it and manages reading and writing only via dedicated methods
 * preventing unauthorized use.
 */
export const createStateImage = <State extends object>(initState?: Partial<State>) => {
  /**
   * Determines authorized access to the state
   */
  let calculationAllowed = false;

  /**
   * Handler used for registering the selector trigger to establish dependency for the selector.
   */
  let triggerJobRoutine: RegisterTriggerJob | null = null;

  /**
   * The map of property keys of the state to the trigger jobs that fires when the value of
   * corresponding property changes.
   */
  const triggerJobStore: Partial<Record<keyof State, Set<() => void>>> = {};
  const { addToPool, runPool } = createJobPool();

  const restrictCalculation = () => {
    if (!calculationAllowed)
      throw new Error('Medama Error: The object has no access to its properties');
  };

  const runWithRestrictionLifted = <V>(toRun: () => V) => {
    calculationAllowed = true;

    return ([toRun(), (calculationAllowed = false), (triggerJobRoutine = null)] as const)[0];
  };

  const readStateFromImage: ReadState<State> = (selector) =>
    runWithRestrictionLifted(() => selector(state));

  const writeState = <K extends keyof State>(toWrite: Pick<State, K>) => {
    runWithRestrictionLifted(() => {
      Object.assign(state, toWrite);
    });

    runPool();
  };

  const registerSelectorTrigger = (selectorTrigger: SelectorTrigger) => {
    triggerJobRoutine = createRegisterTriggerJob(selectorTrigger);

    return readStateFromImage;
  };

  /**
   * Used to create a Proxy for the state object being passed to a selector. It has 3 function:
   * 1. To track the dependency for the selector (registerSelectorTrigger).
   * 2. To see what state property has a value changed to trigger subscriptions of dependent
   *    selectors.
   * 3. Manage authorized access to the state (preventing its capture and using outside the
   *    selector).
   */
  const proxyHandler: ProxyHandler<State> = {
    get: (target, p) => {
      restrictCalculation();
      const registerTriggerJob = triggerJobRoutine;

      if (registerTriggerJob) {
        const triggerStoreRec = (triggerJobStore[p as typeof p & keyof State] ??= new Set());
        registerTriggerJob(triggerStoreRec);
      }

      return target[p as typeof p & keyof State];
    },

    set: (target, p, newValue) => {
      restrictCalculation();
      const oldValue = target[p as typeof p & keyof State];
      target[p as typeof p & keyof State] = newValue;
      const rec = triggerJobStore[p as typeof p & keyof State];

      if (rec && !Object.is(oldValue, newValue)) addToPool(rec);

      return true;
    },
  };

  /**
   * The state object itself constructed through Proxy
   */
  const state = new Proxy({ ...initState } as State, proxyHandler);

  return { writeState, registerSelectorTrigger };
};

type RegisterTriggerJob = (triggerJobSet: Set<() => void>) => void;

/**
 * The method `registerTriggerJob` is creating to populate the `triggerJobRoutine` from the state
 * image to register a selector trigger.
 */
export const createRegisterTriggerJob = (selectorTrigger: SelectorTrigger) => {
  const unregisterPool = new Set<() => void>();

  /**
   * The method running all unregister jobs from the unregister pool.
   */
  const runUnregister = () => {
    unregisterPool.forEach((unregJob) => {
      unregJob();
    });
  };

  /**
   * The job to add to the set of jobs for a certain record of the state.
   */
  const triggerJob = () => {
    selectorTrigger() || runUnregister();
  };

  /**
   * The method receives a set of jobs to run when the corresponding state record was triggered.
   * The method add a trigger job to the set and add the unregister job to the unregister pool.
   */
  const registerTriggerJob = (triggerJobSet: Set<() => void>) => {
    triggerJobSet.add(triggerJob);

    unregisterPool.add(() => {
      triggerJobSet.delete(triggerJob);
    });
  };

  return registerTriggerJob;
};

/**
 * Manage the pool of jobs related to selector triggers. It is populated by the `set` method of the
 * Proxy wrapping the state object to be ready to run.
 */
export const createJobPool = () => {
  const pool = new Set<Set<() => void>>();
  const haveAlreadyBeenRun = new Set<() => void>();

  const addToPool = (jobs: Set<() => void>) => {
    pool.add(jobs);
  };

  const runPool = () => {
    pool.forEach((chunk) => {
      chunk.forEach((job) => {
        if (haveAlreadyBeenRun.has(job)) return;

        job();
        haveAlreadyBeenRun.add(job);
      });
    });

    pool.clear();
    haveAlreadyBeenRun.clear();
  };

  return { addToPool, runPool };
};
