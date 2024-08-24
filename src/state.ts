import { compose, lazily } from 'alnico';
import type { ReadState } from './medama.types';

/**
 * The return of the trigger is an indicator of it being valid. Otherwise it'll be invalidated and
 * removed.
 */
export type SelectorTrigger = () => boolean;

type RunWithRestrictionLifted = <V>(toRun: () => V) => V;

export type RegisterSelectorTrigger<State extends object> = (
  selectorTrigger: SelectorTrigger
) => ReadState<State>;

type StateImageMethods<State extends object> = {
  restrictCalculation: () => void;
  runWithRestrictionLifted: RunWithRestrictionLifted;
  readStateFromImage: ReadState<State>;
  writeState: (toWrite: Partial<State>) => void;
  registerSelectorTrigger: RegisterSelectorTrigger<State>;
};

type ProxyHandler<State> = {
  get: <K extends string | symbol>(target: State, p: K) => State[K & keyof State];
  set: <K extends string | symbol>(target: State, p: K, newValue: State[K & keyof State]) => true;
};

/**
 * The state image is a core flat object holding the state records. It provides an access to them
 * through a Proxy wrapping around it and manages reading and writing only via dedicated methods
 * preventing unauthorized use.
 */
export const createStateImage = <State extends object, K extends keyof State>(
  initState?: Pick<State, K>
) => {
  const { writeState, registerSelectorTrigger } = compose<
    {
      /**
       * Determines authorized access to the state
       */
      calculationAllowed: boolean;

      /**
       * Handler used for registering the selector trigger to establish dependency for the selector.
       */
      triggerJobRoutine: RegisterTriggerJob | null;
    },
    StateImageMethods<State>,
    {
      /**
       * Used to create a Proxy for the state object being passed to a selector. It has 3 function:
       * 1. To track the dependency for the selector (registerSelectorTrigger).
       * 2. To see what state property has a value changed to trigger subscriptions of dependent
       *    selectors.
       * 3. Manage authorized access to the state (preventing its capture and using outside the
       *    selector).
       */
      proxyHandler: ProxyHandler<State>;

      /**
       * The state object itself constructed through Proxy
       */
      state: State;

      /**
       * The map of property keys of the state to the trigger jobs that fires when the value of
       * corresponding property changes.
       */
      triggerJobStore: Partial<Record<keyof State, Set<() => void>>>;
    } & JobPoolMethods
  >(
    { calculationAllowed: false, triggerJobRoutine: null },

    {
      restrictCalculation: ({ calculationAllowed }) => {
        if (!calculationAllowed.get())
          throw new Error('Medama Error: The object has no access to its properties');
      },

      runWithRestrictionLifted: ({ calculationAllowed, triggerJobRoutine }, toRun) => {
        calculationAllowed.set(true);

        return ([toRun(), calculationAllowed.set(false), triggerJobRoutine.set(null)] as const)[0];
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

    {
      proxyHandler: lazily(
        ({ restrictCalculation, triggerJobRoutine, triggerJobStore, addToPool }) => ({
          get: (target, p) => {
            restrictCalculation();
            const registerTriggerJob = triggerJobRoutine.get();

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
        })
      ),

      state: lazily(({ proxyHandler }) => new Proxy({ ...initState } as State, proxyHandler)),

      triggerJobStore: {},

      ...createJobPool(),
    }
  );

  return { writeState, registerSelectorTrigger };
};

type RegisterTriggerJob = (triggerJobSet: Set<() => void>) => void;

/**
 * The method `registerTriggerJob` is creating to populate the `triggerJobRoutine` from the state
 * image to register a selector trigger.
 */
export const createRegisterTriggerJob = (selectorTrigger: SelectorTrigger) =>
  compose<
    {},
    {
      /**
       * The method receives a set of jobs to run when the corresponding state record was triggered.
       * The method add a trigger job to the set and add the unregister job to the unregister pool.
       */
      registerTriggerJob: RegisterTriggerJob;

      /**
       * The job to add to the set of jobs for a certain record of the state.
       */
      triggerJob: () => void;

      /**
       * The method running all unregister jobs from the unregister pool.
       */
      runUnregister: () => void;
    },
    { unregisterPool: Set<() => void> }
  >(
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

type JobPoolMethods = {
  addToPool: (jobs: Set<() => void>) => void;
  runPool: () => void;
};

/**
 * Manage the pool of jobs related to selector triggers. It is populated by the `set` method of the
 * Proxy wrapping the state object to be ready to run.
 */
export const createJobPool = () => {
  const { addToPool, runPool } = compose<
    {},
    JobPoolMethods,
    { pool: Set<Set<() => void>>; haveAlreadyBeenRun: Set<() => void> }
  >(
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
