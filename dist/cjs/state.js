'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.createJobPool = exports.createRegisterTriggerJob = exports.createStateImage = void 0;
const alnico_1 = require('alnico');
/**
 * The state image is a core flat object holding the state records. It provides an access to them
 * through a Proxy wrapping around it and manages reading and writing only via dedicated methods
 * preventing unauthorized use.
 */
const createStateImage = (initState) => {
  const { writeState, registerSelectorTrigger } = (0, alnico_1.compose)(
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
        triggerJobRoutine.set((0, exports.createRegisterTriggerJob)(selectorTrigger));
        return readStateFromImage;
      },
    },
    Object.assign(
      {
        proxyHandler: (0, alnico_1.lazily)(
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
        state: (0, alnico_1.lazily)(
          ({ proxyHandler }) => new Proxy(Object.assign({}, initState), proxyHandler)
        ),
        triggerJobStore: {},
      },
      (0, exports.createJobPool)()
    )
  );
  return { writeState, registerSelectorTrigger };
};
exports.createStateImage = createStateImage;
/**
 * The method `registerTriggerJob` is creating to populate the `triggerJobRoutine` from the state
 * image to register a selector trigger.
 */
const createRegisterTriggerJob = (selectorTrigger) =>
  (0, alnico_1.compose)(
    {},
    {
      registerTriggerJob: ({ triggerJob, unregisterPool }, triggerJobSet) => {
        triggerJobSet.add(triggerJob);
        unregisterPool.add(() => {
          triggerJobSet.delete(triggerJob);
        });
      },
      triggerJob: ({ runUnregister }) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
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
exports.createRegisterTriggerJob = createRegisterTriggerJob;
/**
 * Manage the pool of jobs related to selector triggers. It is populated by the `set` method of the
 * Proxy wrapping the state object to be ready to run.
 */
const createJobPool = () => {
  const { addToPool, runPool } = (0, alnico_1.compose)(
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
exports.createJobPool = createJobPool;
//# sourceMappingURL=state.js.map
