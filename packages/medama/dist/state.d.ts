import type { ReadState } from './medama.types';
/**
 * The return of the trigger is an indicator of it being valid. Otherwise it'll be invalidated and
 * removed.
 */
type SelectorTrigger = () => boolean;
export type RegisterSelectorTrigger<State extends object> = (
  selectorTrigger: SelectorTrigger
) => ReadState<State>;
/**
 * The state image is a core flat object holding the state records. It provides an access to them
 * through a Proxy wrapping around it and manages reading and writing only via dedicated methods
 * preventing unauthorized use.
 */
export declare const createStateImage: <State extends object>(
  initState?: Partial<State>
) => {
  writeState: <K extends keyof State>(toWrite: Pick<State, K>) => void;
  registerSelectorTrigger: (selectorTrigger: SelectorTrigger) => ReadState<State>;
};
/**
 * The method `registerTriggerJob` is creating to populate the `triggerJobRoutine` from the state
 * image to register a selector trigger.
 */
export declare const createRegisterTriggerJob: (
  selectorTrigger: SelectorTrigger
) => (triggerJobSet: Set<() => void>) => void;
/**
 * Manage the pool of jobs related to selector triggers. It is populated by the `set` method of the
 * Proxy wrapping the state object to be ready to run.
 */
export declare const createJobPool: () => {
  addToPool: (jobs: Set<() => void>) => void;
  runPool: () => void;
};
export {};
