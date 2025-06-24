import type { Selector, SetState } from './medama.types';
import { type SelectorTrigger } from './queue-and-selector-management';
export type KeyHandle = (runImmediately: () => void, selectorTrigger: SelectorTrigger) => () => void;
export type KeyHandleCollector = (keyHandle: KeyHandle) => void;
export type RunOverState<State extends object> = <V>(selector: Selector<State, V>, keyHandleCollector?: KeyHandleCollector) => V;
type StateImageMethods<State extends object> = {
    runOverState: RunOverState<State>;
    setState: SetState<State>;
    resetQueue: () => void;
};
export declare const createStateImage: <State extends object>(initState?: Partial<State>) => StateImageMethods<State>;
export {};
//# sourceMappingURL=state.d.ts.map