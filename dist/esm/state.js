import { compose, lazily } from 'alnico';
/**
 * The state image is a core flat object holding the state records. It provides an access to them
 * through a Proxy wrapping around it and manages reading and writing only via dedicated methods
 * preventing unauthorized use.
 */
export const createStateImage = (initState) => {
  const { writeState, registerSelectorTrigger } = compose(
    { calculationAllowed: false, triggerJobRoutine: null },
    {
      restrictCalculation: ({ calculationAllowed }) => {
        if (!calculationAllowed.get())
          throw new Error('Medama Error: The object has no access to its properties');
      },
      runWithRestrictionLifted: ({ calculationAllowed, triggerJobRoutine }, toRun) => {
        calculationAllowed.set(true);
        return [toRun(), calculationAllowed.set(false), triggerJobRoutine.set(null)][0];
      },
      readStateFromImage: ({ state, runWithRestrictionLifted }, selector) =>
        runWithRestrictionLifted(() => selector(state)),
      writeState: ({ state, runWithRestrictionLifted, runPool }, toWrite) => {
        runWithRestrictionLifted(() => {
          Object.assign(state, toWrite);
        });
        runPool();
      },
      registerSelectorTrigger: ({ readStateFromImage, triggerJobRoutine }, selectorTrigger) => {
        triggerJobRoutine.set(createRegisterTriggerJob(selectorTrigger));
        return readStateFromImage;
      },
    },
    Object.assign(
      {
        proxyHandler: lazily(
          ({ restrictCalculation, triggerJobRoutine, triggerJobStore, addToPool }) => ({
            get: (target, p) => {
              var _a;
              var _b;
              restrictCalculation();
              const registerTriggerJob = triggerJobRoutine.get();
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
          })
        ),
        state: lazily(({ proxyHandler }) => new Proxy(Object.assign({}, initState), proxyHandler)),
        triggerJobStore: {},
      },
      createJobPool()
    )
  );
  return { writeState, registerSelectorTrigger };
};
/**
 * The method `registerTriggerJob` is creating to populate the `triggerJobRoutine` from the state
 * image to register a selector trigger.
 */
export const createRegisterTriggerJob = (selectorTrigger) =>
  compose(
    {},
    {
      registerTriggerJob: ({ triggerJob, unregisterPool }, triggerJobSet) => {
        triggerJobSet.add(triggerJob);
        unregisterPool.add(() => {
          triggerJobSet.delete(triggerJob);
        });
      },
      triggerJob: ({ runUnregister }) => {
        selectorTrigger() || runUnregister();
      },
      runUnregister: ({ unregisterPool }) => {
        unregisterPool.forEach((unregJob) => {
          unregJob();
        });
      },
    },
    { unregisterPool: new Set() }
  ).registerTriggerJob;
/**
 * Manage the pool of jobs related to selector triggers. It is populated by the `set` method of the
 * Proxy wrapping the state object to be ready to run.
 */
export const createJobPool = () => {
  const { addToPool, runPool } = compose(
    {},
    {
      addToPool: ({ pool }, jobs) => {
        pool.add(jobs);
      },
      runPool: ({ pool, haveAlreadyBeenRun }) => {
        pool.forEach((chunk) => {
          chunk.forEach((job) => {
            if (haveAlreadyBeenRun.has(job)) return;
            job();
            haveAlreadyBeenRun.add(job);
          });
        });
        pool.clear();
        haveAlreadyBeenRun.clear();
      },
    },
    {
      pool: new Set(),
      haveAlreadyBeenRun: new Set(),
    }
  );
  return { addToPool, runPool };
};
//# sourceMappingURL=state.js.map
