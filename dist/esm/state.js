/**
 * Manages the pool of jobs related to selector triggers. It is populated by the `set` method of the
 * Proxy wrapping the state object to be ready to run.
 */
export class JobPool {
  constructor() {
    this.pool = new Set();
    this.haveAlreadyBeenRun = new Set();
  }
  addToPool(jobs) {
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
 * The state image is a class wrapping a core flat object holding the state records. It provides an
 * access to them through a Proxy wrapping around it and manages reading and writing only via
 * dedicated methods preventing unauthorized use.
 */
export class StateImage extends JobPool {
  constructor(initState) {
    super();
    /**
     * Determines authorized access to the state
     */
    this.calculationAllowed = false;
    /**
     * Handler used for registering the selector trigger to establish dependency for the selector.
     */
    this.triggerJobRoutine = null;
    /**
     * Used to create a Proxy for the state object being passed to a selector. It has 3 function:
     * 1. To track the dependency for the selector (registerSelectorTrigger).
     * 2. To see what state property has a value changed to trigger subscriptions of dependent
     *    selectors.
     * 3. Manage authorized access to the state (preventing its capture and using outside the
     *    selector).
     */
    this.proxyHandler = {
      get: (target, p) => {
        var _a, _b;
        var _c, _d;
        this.restrictCalculation();
        if (
          (_a = this.triggerJobRoutine) === null || _a === void 0 ? void 0 : _a.registerTriggerJob
        ) {
          const triggerStoreRec =
            (_b = (_c = this.triggerJobStore)[(_d = p)]) !== null && _b !== void 0
              ? _b
              : (_c[_d] = new Set());
          this.triggerJobRoutine.registerTriggerJob(triggerStoreRec);
        }
        return target[p];
      },
      set: (target, p, newValue) => {
        this.restrictCalculation();
        const oldValue = target[p];
        target[p] = newValue;
        const rec = this.triggerJobStore[p];
        if (rec && !Object.is(oldValue, newValue)) this.addToPool(rec);
        return true;
      },
    };
    /**
     * The map of property keys of the state to the trigger jobs that fires when the value of
     * corresponding property changes.
     */
    this.triggerJobStore = {};
    this.readStateFromImage = (selector) =>
      this.runWithRestrictionLifted(() => selector(this.state));
    this.state = new Proxy(Object.assign({}, initState), this.proxyHandler);
  }
  restrictCalculation() {
    if (!this.calculationAllowed)
      throw new Error('Medama Error: The object has no access to its properties');
  }
  runWithRestrictionLifted(toRun) {
    this.calculationAllowed = true;
    return [toRun(), (this.calculationAllowed = false), (this.triggerJobRoutine = null)][0];
  }
  writeState(toWrite) {
    this.runWithRestrictionLifted(() => {
      Object.assign(this.state, toWrite);
    });
    this.runPool();
  }
  registerSelectorTrigger(selectorTrigger) {
    this.triggerJobRoutine = new TriggerJob(selectorTrigger);
    return this.readStateFromImage;
  }
}
/**
 * The class `TriggerJob` is for populating the `triggerJobRoutine` from the state image to register
 * a selector trigger.
 */
export class TriggerJob {
  constructor(selectorTrigger) {
    this.unregisterPool = new Set();
    const triggerJob = () => {
      selectorTrigger() || this.runUnregister();
    };
    this.registerTriggerJob = (triggerJobSet) => {
      /**
       * The job to add to the set of jobs for a certain record of the state.
       */
      triggerJobSet.add(triggerJob);
      this.unregisterPool.add(() => {
        triggerJobSet.delete(triggerJob);
      });
    };
  }
  /**
   * The method running all unregister jobs from the unregister pool.
   */
  runUnregister() {
    this.unregisterPool.forEach((unregJob) => {
      unregJob();
    });
  }
}
//# sourceMappingURL=state.js.map
