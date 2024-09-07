import type { Selector } from './medama.types';
/**
 * Manages the pool of jobs related to selector triggers. It is populated by the `set` method of the
 * Proxy wrapping the state object to be ready to run.
 */
export declare class JobPool {
  private readonly pool;
  private readonly haveAlreadyBeenRun;
  addToPool(jobs: Set<() => void>): void;
  runPool(): void;
}
/**
 * The return of the trigger is an indicator of it being valid. Otherwise it'll be invalidated and
 * removed.
 */
export type SelectorTrigger = () => boolean;
/**
 * The state image is a class wrapping a core flat object holding the state records. It provides an
 * access to them through a Proxy wrapping around it and manages reading and writing only via
 * dedicated methods preventing unauthorized use.
 */
export declare class StateImage<State extends object> extends JobPool {
  constructor(initState?: Partial<State>);
  /**
   * Determines authorized access to the state
   */
  private calculationAllowed;
  /**
   * Handler used for registering the selector trigger to establish dependency for the selector.
   */
  private triggerJobRoutine;
  /**
   * Used to create a Proxy for the state object being passed to a selector. It has 3 function:
   * 1. To track the dependency for the selector (registerSelectorTrigger).
   * 2. To see what state property has a value changed to trigger subscriptions of dependent
   *    selectors.
   * 3. Manage authorized access to the state (preventing its capture and using outside the
   *    selector).
   */
  private readonly proxyHandler;
  /**
   * The state object itself constructed through Proxy
   */
  private readonly state;
  /**
   * The map of property keys of the state to the trigger jobs that fires when the value of
   * corresponding property changes.
   */
  private readonly triggerJobStore;
  private restrictCalculation;
  private runWithRestrictionLifted;
  private readStateFromImage;
  writeState<K extends keyof State>(toWrite: Pick<State, K>): void;
  registerSelectorTrigger(selectorTrigger: SelectorTrigger): <V>(selector: Selector<State, V>) => V;
}
/**
 * The class `TriggerJob` is for populating the `triggerJobRoutine` from the state image to register
 * a selector trigger.
 */
export declare class TriggerJob {
  constructor(selectorTrigger: SelectorTrigger);
  private readonly unregisterPool;
  /**
   * The method receives a set of jobs that gets run when the corresponding state record was
   * triggered. It adds a trigger job to that set and the unregister job to the unregister pool.
   */
  registerTriggerJob: (triggerJobSet: Set<() => void>) => void;
  /**
   * The method running all unregister jobs from the unregister pool.
   */
  private runUnregister;
}
