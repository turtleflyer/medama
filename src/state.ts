import type { Selector } from './medama.types';

/**
 * Manages the pool of jobs related to selector triggers. It is populated by the `set` method of the
 * Proxy wrapping the state object to be ready to run.
 */
export class JobPool {
  private readonly pool = new Set<Set<() => void>>();
  private readonly haveAlreadyBeenRun = new Set<() => void>();

  addToPool(jobs: Set<() => void>) {
    this.pool.add(jobs);
  }

  runPool() {
    this.pool.forEach((chunk) => {
      chunk.forEach((job) => {
        if (this.haveAlreadyBeenRun.has(job)) return;

        job();
        this.haveAlreadyBeenRun.add(job);
      });
    });

    this.pool.clear();
    this.haveAlreadyBeenRun.clear();
  }
}

/**
 * The return of the trigger is an indicator of it being valid. Otherwise it'll be invalidated and
 * removed.
 */
export type SelectorTrigger = () => boolean;

type ProxyHandler<State> = {
  get: <K extends string | symbol>(target: State, p: K) => State[K & keyof State];
  set: <K extends string | symbol>(target: State, p: K, newValue: State[K & keyof State]) => true;
};

/**
 * The state image is a class wrapping a core flat object holding the state records. It provides an
 * access to them through a Proxy wrapping around it and manages reading and writing only via
 * dedicated methods preventing unauthorized use.
 */
export class StateImage<State extends object> extends JobPool {
  constructor(initState?: Partial<State>) {
    super();
    this.state = new Proxy({ ...initState } as State, this.proxyHandler);
  }

  /**
   * Determines authorized access to the state
   */
  private calculationAllowed = false;

  /**
   * Handler used for registering the selector trigger to establish dependency for the selector.
   */
  private triggerJobRoutine: TriggerJob | null = null;

  /**
   * Used to create a Proxy for the state object being passed to a selector. It has 3 function:
   * 1. To track the dependency for the selector (registerSelectorTrigger).
   * 2. To see what state property has a value changed to trigger subscriptions of dependent
   *    selectors.
   * 3. Manage authorized access to the state (preventing its capture and using outside the
   *    selector).
   */
  private readonly proxyHandler: ProxyHandler<State> = {
    get: (target, p) => {
      this.restrictCalculation();

      if (this.triggerJobRoutine?.registerTriggerJob) {
        const triggerStoreRec = (this.triggerJobStore[p as typeof p & keyof State] ??= new Set());
        this.triggerJobRoutine.registerTriggerJob(triggerStoreRec);
      }

      return target[p as typeof p & keyof State];
    },

    set: (target, p, newValue) => {
      this.restrictCalculation();
      const oldValue = target[p as typeof p & keyof State];
      target[p as typeof p & keyof State] = newValue;
      const rec = this.triggerJobStore[p as typeof p & keyof State];

      if (rec && !Object.is(oldValue, newValue)) this.addToPool(rec);

      return true;
    },
  };

  /**
   * The state object itself constructed through Proxy
   */
  private readonly state: State;

  /**
   * The map of property keys of the state to the trigger jobs that fires when the value of
   * corresponding property changes.
   */
  private readonly triggerJobStore: Partial<Record<keyof State, Set<() => void>>> = {};

  private restrictCalculation() {
    if (!this.calculationAllowed)
      throw new Error('Medama Error: The object has no access to its properties');
  }

  private runWithRestrictionLifted<V>(toRun: () => V) {
    this.calculationAllowed = true;

    return (
      [toRun(), (this.calculationAllowed = false), (this.triggerJobRoutine = null)] as const
    )[0];
  }

  private readStateFromImage = <V>(selector: Selector<State, V>) =>
    this.runWithRestrictionLifted(() => selector(this.state));

  writeState<K extends keyof State>(toWrite: Pick<State, K>) {
    this.runWithRestrictionLifted(() => {
      Object.assign(this.state, toWrite);
    });

    this.runPool();
  }

  registerSelectorTrigger(selectorTrigger: SelectorTrigger) {
    this.triggerJobRoutine = new TriggerJob(selectorTrigger);

    return this.readStateFromImage;
  }
}

/**
 * The class `TriggerJob` is for populating the `triggerJobRoutine` from the state image to register
 * a selector trigger.
 */
export class TriggerJob {
  constructor(selectorTrigger: SelectorTrigger) {
    const triggerJob = () => {
      selectorTrigger() || this.runUnregister();
    };

    this.registerTriggerJob = (triggerJobSet: Set<() => void>) => {
      /**
       * The job to add to the set of jobs for a certain record of the state.
       */
      triggerJobSet.add(triggerJob);

      this.unregisterPool.add(() => {
        triggerJobSet.delete(triggerJob);
      });
    };
  }

  private readonly unregisterPool = new Set<() => void>();

  /**
   * The method receives a set of jobs that gets run when the corresponding state record was
   * triggered. It adds a trigger job to that set and the unregister job to the unregister pool.
   */
  registerTriggerJob: (triggerJobSet: Set<() => void>) => void;

  /**
   * The method running all unregister jobs from the unregister pool.
   */
  private runUnregister() {
    this.unregisterPool.forEach((unregJob) => {
      unregJob();
    });
  }
}
