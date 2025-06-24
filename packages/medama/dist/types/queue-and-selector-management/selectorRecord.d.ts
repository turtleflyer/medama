import type { SubscriptionJob } from '../medama.types';
type AddSubscription<V> = (subscriptionJob: SubscriptionJob<V>) => () => void;
export type CalculateValue<V> = () => V;
export type SelectorRecord<V> = {
    addSubscription: AddSubscription<V>;
    getValue: CalculateValue<V>;
};
export type SelectorTrigger = {
    trigger: () => void;
    isToAdd: () => boolean;
};
export type ManageSubscriptions = (immediateTask: () => void, selectorTrigger: SelectorTrigger) => void;
export declare const createSelectorRecord: <V>(calculateValue: CalculateValue<V>, manageSubscriptions: ManageSubscriptions, unsubscribe: () => void) => SelectorRecord<V>;
export {};
//# sourceMappingURL=selectorRecord.d.ts.map