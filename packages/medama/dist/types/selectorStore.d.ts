import type { Selector, Subscription, SubscriptionJob, SubscriptionMethods } from './medama.types';
import type { RunOverState } from './state';
type GetSelectorValue<State extends object> = <V>(selector: Selector<State, V>) => V;
type SubscribeToStateInSelectorStore<State extends object> = <V>(selector: Selector<State, V>, subscription: Subscription<V>) => SubscriptionMethods<V>;
export declare const createSelectorStore: <State extends object>(runOverState: RunOverState<State, unknown>) => {
    getSelectorValue: GetSelectorValue<State>;
    subscribeToStateInSelectorStore: SubscribeToStateInSelectorStore<State>;
};
type AddSubscription<V> = (subscriptionJob: SubscriptionJob<V>) => () => void;
type GetValue<V> = () => V;
type SelectorRecord<V> = {
    addSubscription: AddSubscription<V>;
    getValue: GetValue<V>;
};
export declare const createSelectorRecord: <State extends object, V>(selector: Selector<State, V>, runOverState: RunOverState<State, V>) => SelectorRecord<V>;
export {};
//# sourceMappingURL=selectorStore.d.ts.map