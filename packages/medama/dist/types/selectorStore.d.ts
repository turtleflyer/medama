import type { Selector, Subscription, SubscriptionMethods } from './medama.types';
import type { RunOverState } from './state';
type GetSelectorValue<State extends object> = <V>(selector: Selector<State, V>) => V;
type SubscribeToStateInSelectorStore<State extends object> = <V>(selector: Selector<State, V>, subscription: Subscription<V>) => SubscriptionMethods<State, V>;
export declare const createSelectorStore: <State extends object>(runOverState: RunOverState<State>) => {
    getSelectorValue: GetSelectorValue<State>;
    subscribeToStateInSelectorStore: SubscribeToStateInSelectorStore<State>;
};
export {};
//# sourceMappingURL=selectorStore.d.ts.map