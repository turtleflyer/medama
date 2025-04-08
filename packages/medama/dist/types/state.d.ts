import type { ReadState } from './medama.types';
type SelectorTrigger = () => boolean;
export type RegisterSelectorTrigger<State extends object> = (selectorTrigger: SelectorTrigger) => ReadState<State>;
export declare const createStateImage: <State extends object>(initState?: Partial<State>) => {
    writeState: (toWrite: Partial<State>) => void;
    registerSelectorTrigger: (selectorTrigger: SelectorTrigger) => ReadState<State>;
};
export declare const createRegisterTriggerJob: (selectorTrigger: SelectorTrigger) => (triggerJobSet: Set<() => void>) => void;
export declare const createJobPool: () => {
    addToPool: (jobs: Set<() => void>) => void;
    runPool: () => void;
};
export {};
//# sourceMappingURL=state.d.ts.map