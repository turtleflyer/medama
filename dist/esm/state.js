/**
 * The state image is a core flat object holding the state records. It provides an access to them
 * through a Proxy wrapping around it and manages reading and writing only via dedicated methods
 * preventing unauthorized use.
 */
export const createStateImage = (initState) => {
  /**
   * Determines authorized access to the state
   */
  let calculationAllowed = false;
  /**
   * Handler used for registering the selector trigger to establish dependency for the selector.
   */
  let triggerJobRoutine = null;
  /**
   * The map of property keys of the state to the trigger jobs that fires when the value of
   * corresponding property changes.
   */
  const triggerJobStore = {};
  const { addToPool, runPool } = createJobPool();
  const restrictCalculation = () => {
    if (!calculationAllowed)
      throw new Error('Medama Error: The object has no access to its properties');
  };
  const runWithRestrictionLifted = (toRun) => {
    calculationAllowed = true;
    return [toRun(), (calculationAllowed = false), (triggerJobRoutine = null)][0];
  };
  const readStateFromImage = (selector) => runWithRestrictionLifted(() => selector(state));
  const writeState = (toWrite) => {
    runWithRestrictionLifted(() => {
      Object.assign(state, toWrite);
    });
    runPool();
  };
  const registerSelectorTrigger = (selectorTrigger) => {
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
  const proxyHandler = {
    get: (target, p) => {
      var _a;
      var _b;
      restrictCalculation();
      const registerTriggerJob = triggerJobRoutine;
      if (registerTriggerJob) {
        const triggerStoreRec =
          (_a = triggerJobStore[(_b = p)]) !== null && _a !== void 0
            ? _a
            : (triggerJobStore[_b] = new Set());
        registerTriggerJob(triggerStoreRec);
      }
      return target[p];
    },
    set: (target, p, newValue) => {
      restrictCalculation();
      const oldValue = target[p];
      target[p] = newValue;
      const rec = triggerJobStore[p];
      if (rec && !Object.is(oldValue, newValue)) addToPool(rec);
      return true;
    },
  };
  /**
   * The state object itself constructed through Proxy
   */
  const state = new Proxy(Object.assign({}, initState), proxyHandler);
  return { writeState, registerSelectorTrigger };
};
/**
 * The method `registerTriggerJob` is creating to populate the `triggerJobRoutine` from the state
 * image to register a selector trigger.
 */
export const createRegisterTriggerJob = (selectorTrigger) => {
  const unregisterPool = new Set();
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
  const registerTriggerJob = (triggerJobSet) => {
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
  const pool = new Set();
  const haveAlreadyBeenRun = new Set();
  const addToPool = (jobs) => {
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
//# sourceMappingURL=state.js.map
