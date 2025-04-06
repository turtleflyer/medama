import type { Selector, Subscription, SubscriptionJob } from './medama.types';
import type { RegisterSelectorTrigger } from './state';
export declare const createSelectorStore: <State extends object>(registerSelectorTrigger: RegisterSelectorTrigger<State>) => {
    getSelectorValue: <V>(selector: Selector<State, V>) => V;
    subscribeToStateInSelectorStore: <V>(selector: Selector<State, V>, subscription: Subscription<V>) => () => void;
};
type AddSubscription<V> = (subscriptionJob: SubscriptionJob<V>) => () => void;
export declare const createSelectorRecord: <State extends object, V>(selector: Selector<State, V>, registerSelectorTrigger: RegisterSelectorTrigger<State>) => {
    addSubscription: AddSubscription<V>;
    getValue: () => V;
};
export {};
//# sourceMappingURL=selectorStore.d.ts.map