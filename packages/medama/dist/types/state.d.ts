import type { ReadState, Selector, SetState } from './medama.types';
export type SelectorTrigger = () => void;
type UnregisterTriggerFromKeyHandle = () => void;
export type KeyHandle = (trigger: SelectorTrigger) => UnregisterTriggerFromKeyHandle;
export type KeyHandleCollector = (keyHandle: KeyHandle) => void;
export type RegisterSelectorTrigger<State extends object> = (selectorTrigger: SelectorTrigger) => ReadState<State>;
export type RunOverState<State extends object, V> = (selector: Selector<State, V>, keyHandleCollector?: KeyHandleCollector) => V;
export declare const createStateImage: <State extends object>(initState?: Partial<State>) => {
    runOverState: RunOverState<State, unknown>;
    setState: SetState<State>;
};
type AddToQueue = (triggerSet: Set<SelectorTrigger>) => void;
type RunQueue = () => void;
export declare const createJobQueue: () => {
    addToQueue: AddToQueue;
    runQueue: RunQueue;
};
export {};
//# sourceMappingURL=state.d.ts.map